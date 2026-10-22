# Multi-stage Dockerfile for Nuxt 3 Frontend
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/.output ./.output

EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]
