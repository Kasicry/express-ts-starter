# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npm install typescript @types/node --save-dev

RUN npx prisma generate

COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup -g 1001 -S nodejs && adduser -S express -u 1001

COPY --from=builder --chown=express:nodejs /app/dist ./dist
COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs /app/prisma ./prisma
COPY --from=builder --chown=express:nodejs /app/package.json ./

RUN mkdir -p logs && chown -R express:nodejs logs

USER express

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/app.js"]
