# Build from the repo root: docker build -f apps/web/Dockerfile .
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
ARG API_URL=http://api:4000
ENV API_URL=$API_URL
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@allfina/web

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
