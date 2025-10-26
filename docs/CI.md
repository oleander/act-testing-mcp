# CI/CD for Docker Containerized MCP Server

This document describes how the repository builds, tests, and deploys the Dockerized act-testing-mcp MCP server using GitHub Actions. It mirrors the CI/CD acceptance criteria with concrete steps, commands, and troubleshooting tips.

## Overview
- CI builds the Docker image on all pushes/PRs to `main`, tests the containerized server via Docker MCP Gateway, and performs a container health check. CI does not push images.
- CD is triggered after CI completes successfully on `main` and builds/pushes a multi-architecture image to GHCR tagged `:latest`.

## Workflows

### CI (`.github/workflows/ci.yml`)
- Triggers: push to `main`, pull_request to `main`
- Concurrency: cancels in-progress runs per ref/PR
- Permissions: `contents: read`, `packages: write`
- Env: `IMAGE_TAG=ghcr.io/<owner>/act-testing-mcp:latest`

Jobs:
- CI Tests and Checks (Node + pnpm tests)
- Build Docker Image (no push)
- Test MCP Server Tools (uses Docker MCP Gateway and runs tool calls)

Key steps:
```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
- uses: docker/build-push-action@v6
  with:
    push: false
    build-args: ACT_VERSION=0.2.61
    tags: ghcr.io/<owner>/act-testing-mcp:latest
```

MCP tool tests via gateway (each continues on error):
```bash
docker mcp gateway run --servers docker://ghcr.io/<owner>/act-testing-mcp:latest &
sleep 10

docker mcp tools call list_workflows

docker mcp tools call act_doctor

docker mcp tools call validate_workflow '{"workflow": ".github/workflows/ci.yml"}'

docker mcp tools call validate_workflow_content '{"yamlContent": "name: test"}'

docker mcp tools call run_workflow '{"workflow": ".github/workflows/ci.yml", "event": "push", "dryRun": true}'
```

Container health check:
```yaml
- uses: gharlan/docker-healthcheck-action@v1
  with:
    container: act-testing-mcp-test
```

### CD (`.github/workflows/cd.yml`)
- Trigger: `workflow_run` of CI, `types: [completed]`, `branches: [main]`
- Condition: runs only when CI concluded `success`
- Permissions: `contents: read`, `packages: write`
- Env: `BASE_IMAGE_TAG=ghcr.io/<owner>/act-testing-mcp:latest`

Build and push multi-arch:
```yaml
- uses: docker/build-push-action@v6
  with:
    push: true
    platforms: linux/amd64,linux/arm64
    tags: ghcr.io/<owner>/act-testing-mcp:latest
    build-args: ACT_VERSION=0.2.61
```

## Local Testing

Prereqs: Docker with Buildx and the Docker MCP Gateway extension.

- Build image (no push):
```bash
docker buildx build --load -t ghcr.io/<owner>/act-testing-mcp:latest --build-arg ACT_VERSION=0.2.61 .
```

- Run gateway and test tools:
```bash
docker mcp gateway run --servers docker://ghcr.io/<owner>/act-testing-mcp:latest &
sleep 10

docker mcp tools call list_workflows || true

docker mcp tools call act_doctor || true

docker mcp tools call validate_workflow '{"workflow": ".github/workflows/ci.yml"}' || true

docker mcp tools call validate_workflow_content '{"yamlContent": "name: test"}' || true

docker mcp tools call run_workflow '{"workflow": ".github/workflows/ci.yml", "event": "push", "dryRun": true}' || true
```

- Health check example:
```bash
docker run -d --name act-testing-mcp-test ghcr.io/<owner>/act-testing-mcp:latest
# Optionally implement app-level HEALTHCHECK in Dockerfile
```

## Troubleshooting
- Gateway command not found: ensure Docker Desktop/engine supports extensions and the MCP Gateway is installed: `docker extension install docker/mcp-gateway`.
- GHCR auth errors: GITHUB_TOKEN must have `packages: write`. For local pushes, create a PAT with `write:packages`.
- Multi-arch build slow: rely on cache (`type=gha` and registry cache). Consider limiting platforms during debugging.
- Tool calls fail: they are non-blocking in CI. Inspect container logs and validate `IMAGE_TAG`.

## Notes
- CI never pushes images; CD handles publishing on `main` only.
- Latest tag always reflects the most recent successful `main` build.
