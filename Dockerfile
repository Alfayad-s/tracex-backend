# Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tracex

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma/
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER tracex

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
