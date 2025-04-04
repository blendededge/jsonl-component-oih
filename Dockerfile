FROM node:18-alpine AS base

ENV ELASTICIO_OTEL_SERVICE_NAME=COMPONENT:JSONL

WORKDIR /app
RUN apk update && apk add --no-cache \
    bash
COPY lib lib
COPY component.json component.json
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY README.md README.md

FROM base AS dependencies

# Enable corepack and install correct Yarn version
RUN corepack enable && corepack prepare yarn@3.6.3 --activate
# Clear Yarn cache and install dependencies
RUN yarn cache clean && yarn install --production

FROM base AS release
COPY --from=dependencies /app/node_modules ./node_modules
RUN chown -R node:node .
USER node
ENTRYPOINT ["node", "./node_modules/@openintegrationhub/ferryman/runGlobal.js"]
