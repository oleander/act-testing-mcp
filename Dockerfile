# syntax=docker/dockerfile:labs

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

FROM alpine:3.20 AS act-installer
RUN apk add --no-cache ca-certificates curl tar && \
    update-ca-certificates

ARG ACT_VERSION="0.2.82"
ARG TARGETARCH

ENV ARC=${TARGETARCH/amd64/x86_64}
ENV ARC=${ARC/arm64/arm}
ENV ARC=${ARC/arm/armv7}
ENV ARC=${ARC/armv6/armv6}

ADD "https://github.com/nektos/act/releases/download/v${ACT_VERSION}/act_Linux_${ARC}.tar.gz" /tmp/act.tar.gz
RUN tar -xzf /tmp/act.tar.gz -C /usr/local/bin act

FROM node:20-alpine AS runtime

WORKDIR /app
RUN apk add --no-cache docker-cli dumb-init

ENV NODE_ENV=production \
    PROJECT_ROOT=/workspace \
    ACT_BINARY=/usr/local/bin/act

COPY --from=act-installer /usr/local/bin/act /usr/local/bin/act

ARG MCP_METADATA
COPY mcp-metadata.json .
LABEL io.docker.server.metadata="$MCP_METADATA"

COPY --from=deps /app/node_modules ./node_modules

COPY package.json index.js utils/ ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "process.exit(0)"

ENV DOCKER_HOST=unix:///var/run/docker.sock
RUN mkdir -p /app/.github/workflows

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
