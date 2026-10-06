# 1. Base con dependencias para compilación nativa C++ (better-sqlite3)
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++

# 2. Dependencias completas
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder: ejecuta ETL y compilación Next.js standalone
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Ejecutar pipeline ETL para generar data/calles.db e iniciar build standalone
RUN npm run etl
RUN npm run build

# 4. Runner: imagen de producción mínima
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime C++ para better-sqlite3
RUN apk add --no-cache libstdc++

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar artefactos standalone y base de datos embebida
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/data ./data

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
