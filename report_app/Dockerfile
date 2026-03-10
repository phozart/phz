# ── Stage 1: Build phz-grid packages ──
FROM node:20-alpine AS grid-builder

WORKDIR /app/phz-grid
COPY phz-grid/package.json phz-grid/package-lock.json ./
COPY phz-grid/packages/ ./packages/
RUN npm ci --ignore-scripts
RUN npm run build:ordered

# ── Stage 2: Build Next.js app ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy built phz-grid packages (needed for file: deps + webpack aliases)
COPY --from=grid-builder /app/phz-grid /app/phz-grid

# Install report_app dependencies
WORKDIR /app/report_app
COPY report_app/package.json report_app/package-lock.json ./
# Rewrite file: deps to absolute paths inside the container
RUN npm ci

# Copy app source
COPY report_app/ ./

# Build Next.js (standalone output)
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runtime ──
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
