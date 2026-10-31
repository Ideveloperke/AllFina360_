# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@allfina/api
# Self-contained production bundle with only runtime dependencies.
RUN pnpm --filter=@allfina/api deploy --prod --legacy /out

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
