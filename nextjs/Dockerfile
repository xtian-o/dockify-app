# Multi-stage Dockerfile for Next.js with Bun
# Based on official Vercel example
# Platform: linux/amd64

FROM --platform=linux/amd64 oven/bun:1 AS base

WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps
COPY package.json bun.lockb* bun.lock* ./
RUN bun install --no-save --frozen-lockfile

# Stage 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Stage 3: Runner (Production)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["bun", "./server.js"]
