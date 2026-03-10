/// Service configuration — loaded from environment variables.
#[derive(Debug, Clone)]
pub struct Config {
    /// Bind host (default 0.0.0.0)
    pub host: String,
    /// Bind port (default 8080)
    pub port: u16,
    /// Data database connection
    pub data_db_host: String,
    pub data_db_port: u16,
    pub data_db_name: String,
    pub data_db_user: String,
    pub data_db_password: String,
    pub data_db_pool_size: usize,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            host: env("PHZ_HOST", "0.0.0.0"),
            port: env("PHZ_PORT", "8080").parse().expect("PHZ_PORT must be u16"),
            data_db_host: env("DATA_DB_HOST", "localhost"),
            data_db_port: env("DATA_DB_PORT", "5434")
                .parse()
                .expect("DATA_DB_PORT must be u16"),
            data_db_name: env("DATA_DB_NAME", "phz_data"),
            data_db_user: env("DATA_DB_USER", "phz"),
            data_db_password: env("DATA_DB_PASSWORD", "phz"),
            data_db_pool_size: env("DATA_DB_POOL_SIZE", "20")
                .parse()
                .expect("DATA_DB_POOL_SIZE must be usize"),
        }
    }
}

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}
