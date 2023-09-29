FROM node:18-alpine AS base
WORKDIR /app
RUN apk update && apk add --no-cache \
    bash
COPY lib lib
COPY component.json component.json
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY README.md README.md

FROM base AS dependencies

RUN yarn install --production

FROM base AS release
COPY --from=dependencies /app/node_modules ./node_modules
RUN chown -R node:node .
USER node
ENTRYPOINT ["node", "./node_modules/@openintegrationhub/ferryman/runGlobal.js"]
