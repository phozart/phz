use axum::{Router, routing::get};
use crate::db::AppState;

async fn health() -> &'static str {
    "ok"
}

pub fn router() -> Router<AppState> {
    Router::new().route("/health", get(health))
}
