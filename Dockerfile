# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV CI=true

FROM base AS deps
# Keep devDependencies available during Astro build, even if Coolify exposes
# NODE_ENV/NPM_CONFIG_PRODUCTION as build-time variables.
ENV NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund

FROM base AS build
ENV NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS prod-deps
ENV NODE_ENV=production \
    NPM_CONFIG_PRODUCTION=true
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

COPY package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts

EXPOSE 4321
CMD ["sh", "-c", "npm run db:init && node dist/server/entry.mjs"]
