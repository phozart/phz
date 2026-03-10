use axum::body::Body;
use axum::extract::{Path, Query, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use bytes::Bytes;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

use arrow::ipc::writer::StreamWriter;

use crate::arrow_conv;
use crate::db::{self, AppState, PgPool, QueryParams};
use crate::error::AppError;

#[derive(Debug, Deserialize)]
struct DataQueryParams {
    #[serde(default)]
    offset: Option<i64>,
    #[serde(default)]
    limit: Option<i64>,
    #[serde(default)]
    sort: Option<String>,
    #[serde(default)]
    filter: Option<String>,
    /// "json" (default) or "arrow"
    #[serde(default)]
    format: Option<String>,
}

#[derive(Serialize)]
struct JsonDataResponse {
    data: Vec<serde_json::Value>,
    total_count: i64,
    execution_time_ms: u128,
}

/// GET /data/:source — paginated query, returns JSON or Arrow IPC.
async fn query_data(
    State(state): State<AppState>,
    Path(source): Path<String>,
    Query(q): Query<DataQueryParams>,
) -> Result<Response, AppError> {
    let start = Instant::now();
    let pool = &state.local_pool;

    let params = QueryParams {
        source: source.clone(),
        columns: Vec::new(),
        filter: q.filter,
        sort: q.sort,
        offset: q.offset.unwrap_or(0),
        limit: q.limit.unwrap_or(1000),
        group_by: None,
    };

    let (rows, total) = db::execute_query(pool, &params).await?;
    let elapsed = start.elapsed().as_millis();

    let fmt = q.format.as_deref().unwrap_or("json");

    match fmt {
        "arrow" => {
            if rows.is_empty() {
                return Ok((
                    [(header::CONTENT_TYPE, "application/vnd.apache.arrow.stream")],
                    Vec::<u8>::new(),
                )
                    .into_response());
            }

            let pg_columns = rows[0].columns();
            let schema = arrow_conv::schema_from_columns(pg_columns);
            let batch = arrow_conv::rows_to_record_batch(&rows, &schema, pg_columns)?;
            let ipc_bytes = arrow_conv::batch_to_ipc_bytes(&batch)?;

            Ok((
                [
                    (header::CONTENT_TYPE, "application/vnd.apache.arrow.stream"),
                    (
                        header::CONTENT_DISPOSITION,
                        "attachment; filename=\"data.arrow\"",
                    ),
                ],
                Body::from(ipc_bytes),
            )
                .into_response())
        }
        _ => {
            let data: Vec<serde_json::Value> = if rows.is_empty() {
                Vec::new()
            } else {
                let columns = rows[0].columns();
                rows.iter()
                    .map(|row| row_to_json(row, columns))
                    .collect()
            };

            Ok(Json(JsonDataResponse {
                data,
                total_count: total,
                execution_time_ms: elapsed,
            })
            .into_response())
        }
    }
}

/// GET /data/:source/count — quick row count.
async fn count_data(
    State(state): State<AppState>,
    Path(source): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let allowed = ["sales_orders", "employees"];
    if !allowed.contains(&source.as_str()) {
        return Err(AppError::NotFound(format!("unknown source: {source}")));
    }

    let pool = &state.local_pool;
    let conn = pool.get().await?;
    let row = conn
        .query_one(&format!("SELECT COUNT(*) FROM {source}"), &[])
        .await?;
    let count: i64 = row.get(0);

    Ok(Json(serde_json::json!({ "count": count })))
}

// ─── Export: parallel SELECT → Arrow IPC ─────────────────────────────────

/// Below this limit, use a single direct query (no parallel overhead).
const PARALLEL_THRESHOLD: i64 = 50_000;
/// Number of parallel connections for large exports.
const N_PARALLEL: usize = 4;

/// GET /data/:source/export — full export as Arrow IPC.
/// Small exports: single SELECT.
/// Large exports: 4 parallel SELECT queries split by ID range.
async fn export_data(
    State(state): State<AppState>,
    Path(source): Path<String>,
    Query(q): Query<DataQueryParams>,
) -> Result<Response, AppError> {
    let allowed = ["sales_orders", "employees"];
    if !allowed.contains(&source.as_str()) {
        return Err(AppError::NotFound(format!("unknown source: {source}")));
    }

    let pool = state.local_pool.clone();
    let limit = q.limit.unwrap_or(10_000_000).min(10_000_000);

    let (tx, rx) = mpsc::channel::<Result<Bytes, std::io::Error>>(4);

    let source_clone = source.clone();
    tokio::spawn(async move {
        let result = if limit <= PARALLEL_THRESHOLD {
            simple_arrow_export(pool, source_clone, limit, tx.clone()).await
        } else {
            parallel_arrow_export(pool, source_clone, limit, tx.clone()).await
        };
        if let Err(e) = result {
            tracing::error!("export error: {e:?}");
            let _ = tx
                .send(Err(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    e.to_string(),
                )))
                .await;
        }
    });

    let stream = ReceiverStream::new(rx);
    let body = Body::from_stream(stream);

    Ok(Response::builder()
        .header(header::CONTENT_TYPE, "application/vnd.apache.arrow.stream")
        .header(
            header::CONTENT_DISPOSITION,
            "attachment; filename=\"export.arrow\"",
        )
        .header("X-Data-Source", "rust")
        .body(body)
        .unwrap())
}

type BoxErr = Box<dyn std::error::Error + Send + Sync>;

/// Simple single-query export for small datasets (≤ PARALLEL_THRESHOLD rows).
async fn simple_arrow_export(
    pool: PgPool,
    source: String,
    limit: i64,
    tx: mpsc::Sender<Result<Bytes, std::io::Error>>,
) -> Result<(), BoxErr> {
    let t0 = Instant::now();
    let sql = format!("SELECT * FROM {source} LIMIT {limit}");
    let conn = pool.get().await?;
    let rows = conn.query(&sql, &[]).await?;
    drop(conn);

    if rows.is_empty() {
        let _ = tx.send(Ok(Bytes::new())).await;
        return Ok(());
    }

    let pg_cols = rows[0].columns();
    let schema = arrow_conv::schema_from_columns(pg_cols);
    let batch = arrow_conv::rows_to_record_batch(&rows, &schema, pg_cols)
        .map_err(|e| -> BoxErr { Box::new(e) })?;
    let ipc = arrow_conv::batch_to_ipc_bytes(&batch).map_err(|e| -> BoxErr { Box::new(e) })?;

    tracing::info!(
        "simple_export: {source} {} rows, {:.1} MB IPC in {:.1}s",
        batch.num_rows(),
        ipc.len() as f64 / 1_048_576.0,
        t0.elapsed().as_secs_f64()
    );

    const CHUNK: usize = 4 * 1024 * 1024;
    for chunk in ipc.chunks(CHUNK) {
        if tx
            .send(Ok(Bytes::copy_from_slice(chunk)))
            .await
            .is_err()
        {
            break;
        }
    }
    Ok(())
}

/// Parallel export for large datasets (> PARALLEL_THRESHOLD rows).
/// Splits the table into N_PARALLEL ID ranges, fetches them simultaneously,
/// converts each chunk to Arrow independently, then merges into one IPC stream.
async fn parallel_arrow_export(
    pool: PgPool,
    source: String,
    limit: i64,
    tx: mpsc::Sender<Result<Bytes, std::io::Error>>,
) -> Result<(), BoxErr> {
    let t0 = Instant::now();

    // Get ID range (MIN/MAX use primary key index — instant, no COUNT scan)
    let conn = pool.get().await?;
    let range_row = conn
        .query_one(
            &format!("SELECT MIN(id)::bigint, MAX(id)::bigint FROM {source}"),
            &[],
        )
        .await?;
    drop(conn);

    let min_id: i64 = range_row.get(0);
    let max_id: i64 = range_row.get(1);

    let id_range = max_id - min_id + 1;
    let chunk_size = id_range / N_PARALLEL as i64;
    let per_worker_limit = limit / N_PARALLEL as i64;

    tracing::info!(
        "parallel_export: {source} limit={limit} range=[{min_id}..{max_id}] \
         {N_PARALLEL} workers × ~{per_worker_limit} rows"
    );

    // Spawn parallel SELECT workers
    let mut handles = Vec::with_capacity(N_PARALLEL);
    for i in 0..N_PARALLEL {
        let pool = pool.clone();
        let source = source.clone();

        let start = min_id + (i as i64) * chunk_size;
        let end = if i == N_PARALLEL - 1 {
            max_id + 1
        } else {
            start + chunk_size
        };
        let wlimit = if i == N_PARALLEL - 1 {
            limit - per_worker_limit * (N_PARALLEL as i64 - 1)
        } else {
            per_worker_limit
        };
        let worker_id = i;

        handles.push(tokio::spawn(async move {
            let wt = Instant::now();
            let sql = format!(
                "SELECT * FROM {source} WHERE id >= {start} AND id < {end} LIMIT {wlimit}"
            );
            tracing::debug!("worker {worker_id}: {sql}");

            let conn = pool.get().await.map_err(|e| -> BoxErr {
                tracing::error!("worker {worker_id}: pool.get failed: {e:?}");
                Box::new(e)
            })?;
            let rows = conn.query(&sql, &[]).await.map_err(|e| -> BoxErr {
                tracing::error!("worker {worker_id}: query failed: {e:?}");
                Box::new(e)
            })?;
            drop(conn);

            if rows.is_empty() {
                return Ok::<_, BoxErr>(None);
            }

            let pg_cols = rows[0].columns();
            let schema = arrow_conv::schema_from_columns(pg_cols);
            let batch = arrow_conv::rows_to_record_batch(&rows, &schema, pg_cols)
                .map_err(|e| -> BoxErr { Box::new(e) })?;

            tracing::debug!(
                "worker {worker_id}: {} rows in {:.1}s",
                batch.num_rows(),
                wt.elapsed().as_secs_f64()
            );
            Ok(Some(batch))
        }));
    }

    // Collect results
    let mut batches = Vec::with_capacity(N_PARALLEL);
    for handle in handles {
        match handle.await {
            Ok(Ok(Some(batch))) => batches.push(batch),
            Ok(Ok(None)) => {}
            Ok(Err(e)) => return Err(e),
            Err(e) => return Err(Box::new(e)),
        }
    }

    if batches.is_empty() {
        let _ = tx.send(Ok(Bytes::new())).await;
        return Ok(());
    }

    // Write all batches to single IPC stream
    let schema = batches[0].schema();
    let mut writer =
        StreamWriter::try_new(Vec::new(), &schema).map_err(|e| -> BoxErr { Box::new(e) })?;
    for batch in &batches {
        writer
            .write(batch)
            .map_err(|e| -> BoxErr { Box::new(e) })?;
    }
    writer
        .finish()
        .map_err(|e| -> BoxErr { Box::new(e) })?;
    let buf = writer
        .into_inner()
        .map_err(|e| -> BoxErr { Box::new(e) })?;

    let total_rows: usize = batches.iter().map(|b| b.num_rows()).sum();
    tracing::info!(
        "parallel_export done: {total_rows} rows, {:.1} MB IPC in {:.1}s",
        buf.len() as f64 / 1_048_576.0,
        t0.elapsed().as_secs_f64()
    );

    // Send IPC in chunks
    const CHUNK: usize = 4 * 1024 * 1024;
    for chunk in buf.chunks(CHUNK) {
        if tx
            .send(Ok(Bytes::copy_from_slice(chunk)))
            .await
            .is_err()
        {
            break;
        }
    }

    Ok(())
}

// ─── JSON helpers ────────────────────────────────────────────────────────

fn row_to_json(
    row: &tokio_postgres::Row,
    columns: &[tokio_postgres::Column],
) -> serde_json::Value {
    use serde_json::{Number, Value};
    use tokio_postgres::types::Type;

    let mut map = serde_json::Map::new();
    for (i, col) in columns.iter().enumerate() {
        let key = snake_to_camel(col.name());
        let val: Value = match *col.type_() {
            Type::INT2 => row
                .get::<_, Option<i16>>(i)
                .map(|v| Value::Number(Number::from(v)))
                .unwrap_or(Value::Null),
            Type::INT4 => row
                .get::<_, Option<i32>>(i)
                .map(|v| Value::Number(Number::from(v)))
                .unwrap_or(Value::Null),
            Type::INT8 => row
                .get::<_, Option<i64>>(i)
                .map(|v| Value::Number(Number::from(v)))
                .unwrap_or(Value::Null),
            Type::FLOAT4 | Type::FLOAT8 => row
                .get::<_, Option<f64>>(i)
                .and_then(|v| Number::from_f64(v).map(Value::Number))
                .unwrap_or(Value::Null),
            Type::BOOL => row
                .get::<_, Option<bool>>(i)
                .map(Value::Bool)
                .unwrap_or(Value::Null),
            Type::DATE => row
                .get::<_, Option<chrono::NaiveDate>>(i)
                .map(|d| Value::String(d.format("%Y-%m-%d").to_string()))
                .unwrap_or(Value::Null),
            Type::NUMERIC => row
                .try_get::<_, String>(i)
                .ok()
                .and_then(|s| s.parse::<f64>().ok())
                .and_then(|v| Number::from_f64(v).map(Value::Number))
                .unwrap_or(Value::Null),
            _ => row
                .try_get::<_, String>(i)
                .ok()
                .map(Value::String)
                .unwrap_or(Value::Null),
        };
        map.insert(key, val);
    }
    Value::Object(map)
}

fn snake_to_camel(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut capitalize_next = false;
    for ch in s.chars() {
        if ch == '_' {
            capitalize_next = true;
        } else if capitalize_next {
            result.push(ch.to_ascii_uppercase());
            capitalize_next = false;
        } else {
            result.push(ch);
        }
    }
    result
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/data/{source}", get(query_data))
        .route("/data/{source}/count", get(count_data))
        .route("/data/{source}/export", get(export_data))
}
