use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};
use serde::Serialize;

use crate::db::AppState;
use crate::error::AppError;

#[derive(Serialize)]
struct ColumnInfo {
    name: String,
    data_type: String,
    nullable: bool,
}

#[derive(Serialize)]
struct SchemaResponse {
    source: String,
    columns: Vec<ColumnInfo>,
}

/// GET /schema/:source — returns column metadata for a source table.
async fn get_schema(
    State(state): State<AppState>,
    Path(source): Path<String>,
) -> Result<Json<SchemaResponse>, AppError> {
    // Validate source
    let allowed = ["sales_orders", "employees"];
    if !allowed.contains(&source.as_str()) {
        return Err(AppError::NotFound(format!("unknown source: {source}")));
    }

    let pool = &state.local_pool;
    let conn = pool.get().await?;
    let rows = conn
        .query(
            "SELECT column_name, data_type, is_nullable
             FROM information_schema.columns
             WHERE table_name = $1
             ORDER BY ordinal_position",
            &[&source],
        )
        .await?;

    let columns: Vec<ColumnInfo> = rows
        .iter()
        .map(|r| {
            let name: String = r.get(0);
            let data_type: String = r.get(1);
            let nullable: String = r.get(2);
            ColumnInfo {
                name,
                data_type,
                nullable: nullable == "YES",
            }
        })
        .collect();

    Ok(Json(SchemaResponse { source, columns }))
}

pub fn router() -> Router<AppState> {
    Router::new().route("/schema/{source}", get(get_schema))
}
