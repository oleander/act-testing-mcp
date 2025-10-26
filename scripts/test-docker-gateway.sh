#!/usr/bin/env bash
set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "${YELLOW}$1${NC}"; }
ok() { echo -e "${GREEN}$1${NC}"; }
fail() { echo -e "${RED}$1${NC}"; }

step "🐳 Building Docker image..."
docker build -t act-testing-mcp:test .
ok "✓ Docker image built successfully"

step "🔎 Verifying act in image..."
docker run --rm --entrypoint act act-testing-mcp:test --version && ok "✓ act is available"

step "🚀 Smoke test container runtime..."
docker run --rm act-testing-mcp:test node -e "console.log('node ok')" && ok "✓ Node runtime OK"

if [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ]; then
  step "📦 Logging in and pushing test tag..."
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  docker tag act-testing-mcp:test "$DOCKER_USERNAME/act-testing-mcp:test"
  docker push "$DOCKER_USERNAME/act-testing-mcp:test"
  ok "✓ Pushed test image"
fi

# Optional: Gateway checks if extension is installed
if docker extension list 2>/dev/null | grep -q mcp-gateway; then
  ok "✓ Docker MCP Gateway extension found"
  step "🔌 Listing gateway servers..."
  docker mcp gateway list || true
  step "🧪 Running gateway with our server (if image resolvable)..."
  docker mcp gateway run --servers docker://act-testing-mcp:test --test-timeout 30s || true
else
  step "⚠️ Gateway extension not installed; skipping gateway validation"
  echo "Install with: docker extension install docker/mcp-gateway"
fi

ok "🎉 All tests completed"
