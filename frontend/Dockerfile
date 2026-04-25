# Base image for common steps
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

# Install all dependencies (needed for dev and build)
FROM base AS deps
RUN npm ci

# Development stage
FROM deps AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]

# Builder stage for production
FROM deps AS builder
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Next.js production needs public folder, .next build output, node_modules and package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
