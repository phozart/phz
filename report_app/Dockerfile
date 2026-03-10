# ── Stage 1: Build Next.js app ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy pre-built phz-grid packages (dist/ checked into git)
COPY phz-grid/ /app/phz-grid/

# Install report_app dependencies
WORKDIR /app/report_app
COPY report_app/package.json report_app/package-lock.json ./
RUN npm ci
COPY report_app/ ./

# Build Next.js (standalone output)
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: Production runtime ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/report_app/.next/standalone ./
COPY --from=builder /app/report_app/.next/static ./.next/static
COPY --from=builder /app/report_app/public ./public

EXPOSE 3002

CMD ["node", "server.js"]
