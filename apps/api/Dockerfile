ARG PROJECT=@skyjo/api

FROM node:22.9-alpine AS base
RUN apk update && apk add --no-cache libc6-compat && yarn global add pnpm turbo

FROM base AS pruner
ARG PROJECT
WORKDIR /app
COPY . .
RUN turbo prune --scope=${PROJECT} --docker

FROM base AS builder
ARG PROJECT
WORKDIR /app
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/json/ .

RUN pnpm i --ignore-scripts
COPY --from=pruner /app/out/full/ .
RUN pnpm run build --filter=${PROJECT}

ENV NODE_ENV=production
RUN pnpm install --prod --ignore-scripts

FROM base AS runner
ARG PROJECT
WORKDIR /app
COPY --from=builder /app .
WORKDIR /app/apps/api
ENV NODE_ENV=production

CMD ["pnpm", "run", "prod"]
