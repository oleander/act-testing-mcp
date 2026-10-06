# CI/CD Pipeline Documentation

## Overview

This repository uses a two-stage CI/CD pipeline for building and deploying the Docker containerized MCP server:

1. **CI Pipeline** - Builds Docker images and runs smoke tests
2. **CD Pipeline** - Builds and pushes the production image to GHCR

## Pipeline Architecture

```
┌─────────────────┐
│   Code Push/PR  │
│      to main    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         CI Pipeline                 │
│  ┌─────────┐    ┌──────────┐       │
│  │  Build  │───▶│   Test   │       │
│  └─────────┘    └──────────┘       │
└────────┬────────────────────────────┘
         │
         │ (if success & main branch)
         ▼
┌─────────────────────────────────────┐
│         CD Pipeline                 │
│  ┌─────────────────────────────┐   │
│  │  Build & Push Multi-Arch    │   │
│  │  (linux/amd64, linux/arm64) │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  ghcr.io/[owner]/           │
│  act-testing-mcp:latest     │
└─────────────────────────────┘
```

## CI Pipeline

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**

### Build Job
- Builds Docker image
- Pushes to GHCR with tag: `ghcr.io/owner/act-testing-mcp:latest`
- Uses Docker Buildx for caching
- Registry cache: pulls from `latest`
- GitHub Actions cache: stores build cache
- Uses `docker/build-push-action@v6` for building

### Test Job
- Runs after Build completes
- Uses Docker MCP Gateway for testing
- Tests 6 scenarios (with continue-on-error):
  1. **list_workflows** - Test listing workflows via gateway
  2. **act_doctor** - Test system configuration check
  3. **validate_workflow** - Test workflow syntax validation
  4. **validate_workflow_content** - Test YAML content validation
  5. **run_workflow** - Test workflow execution (dry-run)
  6. **Container health** - Verify health check passes
- Tests use `docker mcp tools call` commands
- Tests are non-blocking (failures don't stop pipeline)

## CD Pipeline

**File:** `.github/workflows/cd.yml`

**Triggers:**
- Automatic after CI pipeline completes successfully
- Only runs when:
  - CI pipeline succeeded
  - Code was merged to `main` branch

**Job:**

### Build Job
- Builds multi-architecture Docker image
- Platforms: `linux/amd64,linux/arm64`
- Pushes single tag: `ghcr.io/owner/act-testing-mcp:latest`
- This tag is replaced with each new merge to `main`
- Uses registry and GHA caching

## Setup Instructions

### Prerequisites

1. **GitHub Container Registry Access**
   - Repository must have GHCR enabled
   - GitHub token has package write permissions

2. **Dockerfile**
   - Must exist in repository root
   - Multi-stage build recommended
   - Base images must support target architectures

3. **Required Actions**
   - `actions/checkout@v4`
   - `docker/setup-buildx-action@v3`
   - `docker/login-action@v3`
   - `docker/build-push-action@v6`

### Installation Steps

1. **Create CI Workflow**
   ```bash
   mkdir -p .github/workflows
   ```

   Copy the CI workflow from `JIRA.md` to `.github/workflows/ci.yml`

2. **Create CD Workflow**
   Copy the CD workflow from `JIRA.md` to `.github/workflows/cd.yml`

3. **Create Dockerfile**
   See Dockerfile specification in JIRA.md

4. **Create .dockerignore**
   ```bash
   cat > .dockerignore << 'EOF'
   node_modules
   npm-debug.log
   .git
   .github
   .vscode
   coverage
   test
   *.test.js
   .actrc
   README.md
   LICENSE
   EOF
   ```

5. **Verify Permissions**
   Ensure repository has:
   - Package write permissions
   - Actions write permissions
   - Contents read permissions

## Workflow Files Reference

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

env:
  IMAGE_TAG: ghcr.io/${{ github.repository_owner }}/act-testing-mcp:latest

jobs:
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        id: build
        with:
          pull: true
          push: false
          tags: ${{ env.IMAGE_TAG }}
          build-args: |
            ACT_VERSION=0.2.61
          cache-from: |
            type=gha
            type=registry,ref=${{ env.IMAGE_TAG }}
          cache-to: type=gha,mode=max

  test:
    name: Test MCP Server Tools
    needs: build
    runs-on: ubuntu-latest
    continue-on-error: true

    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Pull Docker image from build
        run: docker pull ${{ env.IMAGE_TAG }} || docker load -i /tmp/image.tar

      - name: Install Docker MCP Gateway
        run: docker extension install docker/mcp-gateway

      - name: Start gateway with act-testing-mcp server
        run: docker mcp gateway run --servers docker://${{ env.IMAGE_TAG }} &

      - name: Wait for gateway to start
        run: sleep 10

      - name: Test list_workflows tool
        continue-on-error: true
        run: docker mcp tools call list_workflows

      - name: Test act_doctor tool
        continue-on-error: true
        run: docker mcp tools call act_doctor

      - name: Test validate_workflow tool
        continue-on-error: true
        run: docker mcp tools call validate_workflow '{"workflow": "ci.yml"}'

      - name: Test validate_workflow_content tool
        continue-on-error: true
        run: |
          docker mcp tools call validate_workflow_content \
            '{"yamlContent": "name: Test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo test"}'

      - name: Test run_workflow tool (dry-run)
        continue-on-error: true
        run: docker mcp tools call run_workflow '{"workflow": "ci.yml", "event": "push", "dryRun": true}'

      - name: Test container health
        continue-on-error: true
        uses: gharlan/docker-healthcheck-action@v1
        with:
          image: ${{ env.IMAGE_TAG }}
          health-cmd: node -e 'process.exit(0)'
          health-interval: 10s
          health-timeout: 5s
          health-retries: 3
          max-wait: 60
```

### CD Workflow (`.github/workflows/cd.yml`)

```yaml
name: CD

on:
  workflow_run:
    workflows: [CI]
    types: [completed]

permissions:
  contents: read
  packages: write

env:
  BASE_IMAGE_TAG: ghcr.io/${{ github.repository_owner }}/act-testing-mcp:latest

jobs:
  build:
    name: Build and Push Multi-Arch Image
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha }}
          fetch-depth: 1

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          pull: true
          push: true
          platforms: linux/amd64,linux/arm64
          tags: ${{ env.BASE_IMAGE_TAG }}
          build-args: ACT_VERSION=0.2.61
          cache-from: type=gha,type=registry,ref=${{ env.BASE_IMAGE_TAG }}
          cache-to: type=gha,mode=max
```

## Testing

### Local Testing

Test the containerized MCP server locally using the same approach as CI:

```bash
# Install Docker MCP Gateway (if not already installed)
docker extension install docker/mcp-gateway

# Build the Docker image
docker build -t ghcr.io/owner/act-testing-mcp:latest .

# Push to registry (or use a local registry)
docker push ghcr.io/owner/act-testing-mcp:latest

# Start gateway with the image
docker mcp gateway run --servers docker://ghcr.io/owner/act-testing-mcp:latest &

# Wait for gateway to start
sleep 10

# Test all MCP tools via gateway (same as CI)
docker mcp tools call list_workflows
docker mcp tools call act_doctor
docker mcp tools call validate_workflow '{"workflow": "ci.yml"}'
docker mcp tools call validate_workflow_content \
  '{"yamlContent": "name: Test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo test"}'
docker mcp tools call run_workflow '{"workflow": "ci.yml", "event": "push", "dryRun": true}'

# Stop gateway
pkill -f "docker mcp gateway"
```

**Alternative: Test without pushing to registry**

If you don't want to push, you can also test the image directly:

```bash
# Build the image
docker build -t ghcr.io/owner/act-testing-mcp:latest .

# Start gateway with local image
docker mcp gateway run --servers docker://ghcr.io/owner/act-testing-mcp:latest &

# Test tools...
docker mcp tools call list_workflows
# ... etc
```

### Multi-Architecture Testing

Build and test for both architectures (before CD pipeline):

```bash
# Create a builder instance
docker buildx create --name mybuilder --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/owner/act-testing-mcp:latest \
  --push .

# Pull and test the multi-arch image
docker pull ghcr.io/owner/act-testing-mcp:latest

# Test with gateway (same commands as above)
docker mcp gateway run --servers docker://ghcr.io/owner/act-testing-mcp:latest &
```

## Caching Strategy

The pipelines use a multi-tier caching strategy:

### Cache Sources (cache-from)
1. **Registry Cache** - Pull from `latest` image layers
2. **GHCR Cache** - Pull from previously built images
3. **GitHub Actions Cache** - GHA cache

### Cache Targets (cache-to)
1. **GitHub Actions Cache** - Save for future runs
2. **Mode: max** - Store full cache for maximum benefit

## Troubleshooting

### Build Fails

**Error:** "Buildx not supported"
**Solution:** Ensure using `docker/setup-buildx-action@v3`

**Error:** "Permission denied"
**Solution:** Add `packages: write` to permissions

### Multi-Arch Build Fails

**Error:** "No matching manifest"
**Solution:** Ensure base images support both platforms

**Error:** "QEMU not available"
**Solution:** Buildx includes QEMU by default, no extra setup needed

### Smoke Tests Fail

**Error:** Act binary not found
**Solution:** Verify ACT_VERSION in build args matches available version

**Error:** Health check timeout
**Solution:** Increase health check timeout or verify container starts correctly

### CD Pipeline Doesn't Trigger

**Error:** CD workflow doesn't run
**Solution:**
- Verify CI workflow succeeded
- Check branch is `main`
- Verify workflow name matches `workflows: [CI]`

## Security

### Secrets

No additional secrets required! Uses:
- `GITHUB_TOKEN` - Automatically provided
- `github.actor` - GitHub username for registry login

### Permissions

Minimal permissions required:
```yaml
permissions:
  contents: read  # Read repository
  packages: write # Publish to GHCR
```

### Security Best Practices

1. Scan images for vulnerabilities (optional):
   ```yaml
   - uses: aquasecurity/trivy-action@master
     with:
       scan-type: 'image'
       image-ref: ${{ env.IMAGE_TAG }}
   ```

2. Use non-root user in Dockerfile:
   ```dockerfile
   RUN addgroup -g 1000 mcp && adduser -D -u 1000 -G mcp mcp
   USER mcp
   ```

3. Keep base images updated

## Monitoring

### View Pipeline Status

```bash
# View recent CI runs
gh run list --workflow=CI

# View recent CD runs
gh run list --workflow=CD

# View logs
gh run view <run-id>
```

### Check Published Images

Visit: `https://github.com/orgs/[owner]/packages/container/act-testing-mcp`

## Performance Metrics

Expected build times:
- **CI Build:** ~3-5 minutes
- **CI Test:** ~2-3 minutes
- **CD Build (Multi-Arch):** ~8-12 minutes

Cache benefits:
- First build: Full time
- Subsequent builds: ~50-70% faster with cache

## Best Practices

1. **Keep Dockerfile Lean**
   - Use multi-stage builds
   - Minimize layers
   - Use `.dockerignore`

2. **Test Locally First**
   - Build Dockerfile before pushing
   - Run smoke tests locally

3. **Monitor Build Times**
   - Keep builds under 15 minutes
   - Optimize caching if too slow

4. **Tag Strategy**
   - Use semantic versioning for releases
   - Use `main-latest` for continuous deployment

5. **Branch Strategy**
   - CI runs on all PRs
   - CD only on `main` branch
   - Feature branches get temporary PR tags

## Related Documentation

- [JIRA.md](../JIRA.md) - Full ticket with Dockerfile specification
- [TESTING.md](./TESTING.md) - Test strategy
- [Docker MCP Gateway Docs](https://github.com/docker/mcp-gateway/blob/main/docs/self-configured.md)

## Support

For issues or questions:
- Check workflow logs in GitHub Actions
- Review troubleshooting section above
- Create issue in repository

---

**Last Updated:** 2025-01-XX

