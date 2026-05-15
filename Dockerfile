FROM node:20-alpine AS base

# ── Dependencias ──────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client generado
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL dummy para que el build no falle
# (las páginas dinámicas no se pre-renderizan)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV JWT_SECRET="build-time-dummy-secret-replace-in-production"

RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client y schema para runtime
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Script de inicio: corre migrate + seed + app
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
