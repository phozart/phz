use crate::config::Config;
use deadpool_postgres::{Manager, ManagerConfig, Pool, RecyclingMethod};
use tokio_postgres::NoTls;

pub type PgPool = Pool;

/// Shared application state.
#[derive(Clone)]
pub struct AppState {
    pub local_pool: PgPool,
}

pub async fn create_pool(cfg: &Config) -> anyhow::Result<PgPool> {
    let mut pg_cfg = tokio_postgres::Config::new();
    pg_cfg
        .host(&cfg.data_db_host)
        .port(cfg.data_db_port)
        .dbname(&cfg.data_db_name)
        .user(&cfg.data_db_user)
        .password(&cfg.data_db_password);

    let mgr_cfg = ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    };
    let mgr = Manager::from_config(pg_cfg, NoTls, mgr_cfg);
    let pool = Pool::builder(mgr)
        .max_size(cfg.data_db_pool_size)
        .build()?;

    // Verify connectivity
    let conn = pool.get().await?;
    conn.execute("SELECT 1", &[]).await?;
    tracing::info!(
        "connected to data DB {}:{}/{}",
        cfg.data_db_host,
        cfg.data_db_port,
        cfg.data_db_name
    );

    Ok(pool)
}
