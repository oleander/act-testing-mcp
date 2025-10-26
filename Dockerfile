# syntax=docker/dockerfile:1

# ---------------------------------------
# Stage 1: Install production dependencies
# ---------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production deps for runtime (SDK)
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# ---------------------------------------
# Stage 2: Fetch nektos/act binary (arch-aware)
# ---------------------------------------
FROM alpine:3.20 AS act-installer
ARG ACT_VERSION="0.2.61"
ARG TARGETARCH

RUN apk add --no-cache curl ca-certificates tar && update-ca-certificates

# Download the appropriate act tarball for the target architecture
RUN set -eux; \
    case "$TARGETARCH" in \
      "amd64") ACT_ARCH="x86_64" ;; \
      "arm64") ACT_ARCH="arm64" ;; \
      "arm") ACT_ARCH="armv7" ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
    esac; \
    curl -fsSL -o /tmp/act.tgz "https://github.com/nektos/act/releases/download/v${ACT_VERSION}/act_Linux_${ACT_ARCH}.tar.gz"; \
    tar -xzf /tmp/act.tgz -C /usr/local/bin act; \
    chmod +x /usr/local/bin/act; \
    /usr/local/bin/act --version || true

# ---------------------------------------
# Stage 3: Final runtime image
# ---------------------------------------
FROM node:20-alpine
WORKDIR /app

# Tiny init for proper signal handling
RUN apk add --no-cache dumb-init docker-cli

# Runtime env defaults
ENV NODE_ENV=production \
    PROJECT_ROOT=/workspace \
    ACT_BINARY=/usr/local/bin/act

# App dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY index.js ./index.js
COPY utils ./utils

# Tools
COPY --from=act-installer /usr/local/bin/act /usr/local/bin/act

# Non-root user
RUN addgroup -g 1000 mcp && adduser -D -u 1000 -G mcp mcp && \
    chown -R mcp:mcp /app
USER mcp

# Healthcheck: basic Node availability (stdio protocol has no HTTP)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "process.exit(0)"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
