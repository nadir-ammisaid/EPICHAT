FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/epichat?schema=public
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
RUN npm run build

FROM base AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["npm", "run", "start"]
