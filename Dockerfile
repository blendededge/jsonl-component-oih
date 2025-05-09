FROM node:18-alpine AS base

ENV ELASTICIO_OTEL_SERVICE_NAME=COMPONENT:JSONL

WORKDIR /app
RUN apk update && apk add --no-cache \
    bash
COPY lib lib
COPY component.json component.json
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY README.md README.md

FROM base AS dependencies

# Install production dependencies
RUN npm ci --only=production

FROM base AS release
COPY --from=dependencies /app/node_modules ./node_modules
RUN chown -R node:node .
USER node
ENTRYPOINT ["node", "./node_modules/@openintegrationhub/ferryman/runGlobal.js"]
