use crate::error::AppError;
use deadpool_postgres::Pool;
use serde::Deserialize;
use tokio_postgres::Row;

/// Query parameters from the HTTP request.
#[derive(Debug, Deserialize)]
pub struct QueryParams {
    /// Table / source name (validated against allowlist)
    pub source: String,
    /// Column subset (if empty, all columns)
    #[serde(default)]
    pub columns: Vec<String>,
    /// SQL WHERE fragments: "column:op:value" — validated & parameterized
    #[serde(default)]
    pub filter: Option<String>,
    /// Sort: "column:asc" or "column:desc"
    #[serde(default)]
    pub sort: Option<String>,
    /// Pagination offset
    #[serde(default)]
    pub offset: i64,
    /// Pagination limit (max 100_000, default 1000)
    #[serde(default = "default_limit")]
    pub limit: i64,
    /// Group-by column (returns aggregation)
    #[serde(default)]
    pub group_by: Option<String>,
}

fn default_limit() -> i64 {
    1000
}

/// Allowed source tables — prevents SQL injection via table name.
const ALLOWED_SOURCES: &[&str] = &["sales_orders", "employees"];

/// Allowed columns per source — prevents SQL injection via column names.
fn allowed_columns(source: &str) -> &'static [&'static str] {
    match source {
        "sales_orders" => &[
            "id",
            "date",
            "year",
            "quarter",
            "month",
            "product",
            "category",
            "region",
            "sales_rep",
            "quantity",
            "unit_price",
            "discount",
            "amount",
            "profit",
            "payment_method",
            "status",
            "customer_name",
            "customer_email",
            "order_priority",
            "shipping_method",
            "shipping_cost",
            "tax_amount",
            "total_amount",
            "warehouse",
            "channel",
            "currency",
            "exchange_rate",
            "return_flag",
            "fulfillment_date",
            "lead_time_days",
            "margin_pct",
            "notes",
            "data_source",
        ],
        "employees" => &[
            "id",
            "name",
            "email",
            "department",
            "position",
            "salary",
            "rating",
            "start_date",
            "status",
            "location",
            "projects",
            "is_remote",
        ],
        _ => &[],
    }
}

/// Validate source name against allowlist.
fn validate_source(source: &str) -> Result<(), AppError> {
    if !ALLOWED_SOURCES.contains(&source) {
        return Err(AppError::NotFound(format!("unknown source: {source}")));
    }
    Ok(())
}

/// Validate column name against allowed columns for the source.
fn validate_column(source: &str, col: &str) -> Result<(), AppError> {
    if !allowed_columns(source).contains(&col) {
        return Err(AppError::BadRequest(format!(
            "invalid column '{col}' for source '{source}'"
        )));
    }
    Ok(())
}

/// Build a WHERE clause from the filter string.
/// Format: "column:op:value,column:op:value"
/// Ops: eq, neq, gt, gte, lt, lte, in, like
fn build_where(source: &str, filter: &str) -> Result<(String, Vec<String>), AppError> {
    let mut clauses = Vec::new();
    let mut params: Vec<String> = Vec::new();

    for part in filter.split(',') {
        let segments: Vec<&str> = part.splitn(3, ':').collect();
        if segments.len() != 3 {
            return Err(AppError::BadRequest(format!("bad filter segment: {part}")));
        }
        let (col, op, val) = (segments[0], segments[1], segments[2]);
        validate_column(source, col)?;

        match op {
            "eq" => {
                params.push(val.to_string());
                clauses.push(format!("{col} = ${}", params.len()));
            }
            "neq" => {
                params.push(val.to_string());
                clauses.push(format!("{col} != ${}", params.len()));
            }
            "gt" => {
                params.push(val.to_string());
                clauses.push(format!("{col} > ${}", params.len()));
            }
            "gte" => {
                params.push(val.to_string());
                clauses.push(format!("{col} >= ${}", params.len()));
            }
            "lt" => {
                params.push(val.to_string());
                clauses.push(format!("{col} < ${}", params.len()));
            }
            "lte" => {
                params.push(val.to_string());
                clauses.push(format!("{col} <= ${}", params.len()));
            }
            "in" => {
                let values: Vec<&str> = val.split('|').collect();
                let placeholders: Vec<String> = values
                    .iter()
                    .map(|v| {
                        params.push(v.to_string());
                        format!("${}", params.len())
                    })
                    .collect();
                clauses.push(format!("{col} IN ({})", placeholders.join(",")));
            }
            "like" => {
                params.push(format!("%{val}%"));
                clauses.push(format!("{col} ILIKE ${}", params.len()));
            }
            _ => {
                return Err(AppError::BadRequest(format!("unknown filter op: {op}")));
            }
        }
    }

    Ok((clauses.join(" AND "), params))
}

/// Execute a paginated query and return rows + total count.
pub async fn execute_query(
    pool: &Pool,
    params: &QueryParams,
) -> Result<(Vec<Row>, i64), AppError> {
    validate_source(&params.source)?;

    let cols = if params.columns.is_empty() {
        "*".to_string()
    } else {
        for c in &params.columns {
            validate_column(&params.source, c)?;
        }
        params.columns.join(", ")
    };

    let limit = params.limit.min(100_000).max(1);
    let mut sql = format!("SELECT {cols} FROM {}", params.source);
    let mut count_sql = format!("SELECT COUNT(*) FROM {}", params.source);
    let mut query_params: Vec<String> = Vec::new();

    // WHERE
    if let Some(ref filter) = params.filter {
        if !filter.is_empty() {
            let (where_clause, wp) = build_where(&params.source, filter)?;
            query_params = wp;
            sql = format!("{sql} WHERE {where_clause}");
            count_sql = format!("{count_sql} WHERE {where_clause}");
        }
    }

    // ORDER BY
    if let Some(ref sort) = params.sort {
        let parts: Vec<&str> = sort.splitn(2, ':').collect();
        let col = parts[0];
        validate_column(&params.source, col)?;
        let dir = if parts.len() > 1 && parts[1].eq_ignore_ascii_case("desc") {
            "DESC"
        } else {
            "ASC"
        };
        sql = format!("{sql} ORDER BY {col} {dir}");
    }

    // LIMIT / OFFSET
    let param_offset = query_params.len();
    sql = format!("{sql} LIMIT ${} OFFSET ${}", param_offset + 1, param_offset + 2);

    let conn = pool.get().await?;

    // Build param refs for tokio-postgres (it wants &dyn ToSql)
    let mut boxed_params: Vec<Box<dyn tokio_postgres::types::ToSql + Sync + Send>> = query_params
        .iter()
        .map(|s| Box::new(s.clone()) as Box<dyn tokio_postgres::types::ToSql + Sync + Send>)
        .collect();
    boxed_params.push(Box::new(limit));
    boxed_params.push(Box::new(params.offset));

    let param_refs: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = boxed_params
        .iter()
        .map(|b| &**b as &(dyn tokio_postgres::types::ToSql + Sync))
        .collect();

    let rows = conn.query(&sql, &param_refs).await?;

    // Count query uses the same WHERE params (no LIMIT/OFFSET)
    let count_param_refs: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = boxed_params
        [..query_params.len()]
        .iter()
        .map(|b| &**b as &(dyn tokio_postgres::types::ToSql + Sync))
        .collect();
    let count_row = conn.query_one(&count_sql, &count_param_refs).await?;
    let total: i64 = count_row.get(0);

    Ok((rows, total))
}
