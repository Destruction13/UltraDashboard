# syntax=docker/dockerfile:1.7
# UltraDashboard — V1 production image.
#
# Multi-stage build. The runtime image only carries the Next.js standalone
# output and the static assets, so it stays small and easy to ship to the VPS
# alongside OmniRoute.

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# libc6-compat for glibc-built prebuilds; python3/make/g++ for native addons
# (better-sqlite3) when a musl prebuild isn't available for our arch.
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Carry better-sqlite3's compiled native binding into the runtime image.
# Next.js standalone tracing usually picks this up, but copying it explicitly
# keeps the OmniRoute mirror working even if the trace misses the .node file.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
