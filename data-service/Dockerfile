# ── Build stage ──
FROM rust:1.94-slim AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src/ ./src/

RUN cargo build --release

# ── Runtime stage ──
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/phz-data-service /usr/local/bin/phz-data-service

ENV PHZ_HOST=0.0.0.0
ENV PHZ_PORT=8080

EXPOSE 8080

CMD ["phz-data-service"]
