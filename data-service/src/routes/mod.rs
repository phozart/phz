mod data;
mod health;
mod schema;

use axum::Router;

use crate::db::AppState;

pub fn api_router() -> Router<AppState> {
    Router::new()
        .merge(health::router())
        .merge(data::router())
        .merge(schema::router())
}
