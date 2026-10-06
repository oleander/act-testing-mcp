# 🎫 JIRA TICKET: Add Dockerfile for Docker MCP Gateway Integration

**Issue Type:** Story
**Priority:** Medium
**Epic Link:** MCP Docker Integration
**Components:** `Docker`, `MCP Gateway`, `CI/CD`
**Labels:** `mcp`, `docker`, `containerization`, `deployment`, `act`, `github-actions`
**Sprint:** Backlog

---

## Title

Add Dockerfile, Containerization Support, and CI/CD Pipelines for Docker MCP Gateway Integration

---

## Story

**As a** developer using the Docker MCP Gateway
**I want** to run `act-testing-mcp` as a containerized MCP server
**So that** I can deploy and manage it via Docker without needing to install dependencies locally

---

## Background & Context

This ticket implements Docker containerization and CI/CD pipelines for the act-testing-mcp MCP server. The complete implementation guide is documented in [`docs/CI.md`](./docs/CI.md).

### Current State

The [act-testing-mcp](https://github.com/GarthDB/act-testing-mcp) server currently runs as a native application requiring:
- Node.js 20+ (LTS)
- nektos/act installed
- Docker Desktop running
- Access to `.github/workflows/` directory
- MCP SDK dependency (`@modelcontextprotocol/sdk`)

Containerizing the server will enable:
- **Docker MCP Gateway Integration**: Deploy via the [Docker MCP Gateway](https://github.com/docker/mcp-gateway/blob/main/docs/self-configured.md)
- **No Local Installation**: Eliminate the need for local act installation
- **Consistent Environments**: Ensure identical runtime across machines
- **Improved Isolation**: Enhanced security through containerization
- **CI/CD Ready**: Ready for Kubernetes and Docker Swarm

---

## Business Value

- **Simplified Deployment**: Containerized distribution via Docker Hub/GHCR
- **Reduced Dependencies**: Users don't need to install Node.js, act, or Docker locally
- **Consistent Environments**: Same behavior across development, staging, production
- **Enhanced Security**: Containerization provides isolation from host system
- **CI/CD Integration**: Easy integration into automated pipelines and orchestration
- **Scalability**: Can be deployed and scaled using container orchestration tools

---

## Acceptance Criteria

### 1. Dockerfile Creation

- [ ] Multi-stage Dockerfile following best practices
- [ ] Base Node.js 20+ image (e.g., `node:20-alpine`)
- [ ] Install `act` binary from GitHub Releases
- [ ] Install Docker CLI for Docker-in-Docker (DinD) support
- [ ] Copy `package.json`, install dependencies
- [ ] Copy `index.js` and `utils/` directory
- [ ] Configure non-root user
- [ ] Create `.dockerignore` file
- [ ] Optimize image size and layer caching
- [ ] Add HEALTHCHECK instruction

### 2. Docker Compose Configuration

- [ ] Create `docker-compose.yml` file
- [ ] Bind mount Docker socket: `/var/run/docker.sock:/var/run/docker.sock`
- [ ] Volume mount for project: `./:/workspace`
- [ ] Environment variables:
  - `PROJECT_ROOT=/workspace`
  - `ACT_BINARY=/usr/local/bin/act`
  - `NODE_ENV=production`
- [ ] Health check configuration
- [ ] Optional: Docker-in-Docker sidecar service

### 3. Documentation

- [ ] Create `docs/DOCKER.md` with:
  - Build instructions
  - Run instructions
  - Usage examples
  - Troubleshooting guide
  - Docker MCP Gateway integration steps
- [ ] Update `README.md` with Docker section
- [ ] Create `.dockerignore` file

### 4. Docker MCP Gateway Integration Tests ⭐ NEW

- [ ] Build Docker image successfully
- [ ] Push image to Docker registry (Docker Hub or GHCR)
- [ ] Run server using `docker mcp gateway run --servers docker://namespace/repository:latest`
- [ ] Verify server discovery by Docker MCP Gateway
- [ ] Test all MCP tools through gateway:
  - `list_workflows`
  - `run_workflow`
  - `validate_workflow`
  - `act_doctor`
- [ ] Validate workflow execution through gateway
- [ ] Test server with multiple concurrent connections
- [ ] Verify error handling and logging
- [ ] Performance testing (response times)
- [ ] Document testing process in `docs/TESTING.md`

### 5. CI/CD Pipeline Implementation ⭐ NEW

#### CI Pipeline (`.github/workflows/ci.yml`)

- [ ] Create CI workflow that triggers on push to main and PRs
- [ ] Build job that builds Docker image (push: false)
- [ ] Build job uses `docker/build-push-action@v6`
- [ ] Build job uses `docker/setup-buildx-action@v3`
- [ ] Build job uses `docker/login-action@v3`
- [ ] Build job uses `actions/checkout@v4` (no fetch-depth)
- [ ] Build job tags image as `:latest`
- [ ] Build job uses cache-from: type=gha, type=registry
- [ ] Build job uses cache-to: type=gha,mode=max
- [ ] Test job depends on build job (needs: build)
- [ ] Test job installs Docker MCP Gateway extension
- [ ] Test job pulls/loads the built image
- [ ] Test job starts gateway: `docker mcp gateway run --servers docker://${{ env.IMAGE_TAG }}`
- [ ] Test job tests all 5 MCP tools via `docker mcp tools call`:
  - list_workflows
  - act_doctor
  - validate_workflow
  - validate_workflow_content
  - run_workflow
- [ ] Test job includes container health check using `gharlan/docker-healthcheck-action@v1`
- [ ] All test steps use `continue-on-error: true`
- [ ] Test job uses `continue-on-error: true` at job level
- [ ] Workflow uses concurrency group to cancel in-progress runs

#### CD Pipeline (`.github/workflows/cd.yml`)

- [ ] Create CD workflow that triggers after CI completion
- [ ] Uses `workflow_run` trigger with `workflows: [CI]` and `types: [completed]`
- [ ] Only builds and pushes on main branch (check workflow_run head_branch)
- [ ] Build job builds multi-arch image: `platforms: linux/amd64,linux/arm64`
- [ ] Build job uses latest versions of actions
- [ ] Build job pushes to `ghcr.io/owner/act-testing-mcp:latest`
- [ ] Build job uses proper caching strategy
- [ ] Build job checks out using `github.event.workflow_run.head_sha`

### 6. Documentation Updates

- [ ] Create `docs/CI.md` with CI/CD pipeline documentation
- [ ] Update `JIRA.md` with CI/CD requirements
- [ ] Local testing instructions match CI workflow approach
- [ ] Document Docker MCP Gateway testing commands
- [ ] Include troubleshooting section for CI/CD

---

## Technical Specifications

### MCP Server Architecture

- **Entry Point**: `index.js` (ES module)
- **Transport**: stdio (MCP Server SDK)
- **Tools**: `list_workflows`, `run_workflow`, `validate_workflow`, `act_doctor`
- **Dependencies**: `@modelcontextprotocol/sdk@^1.0.0`

### Container Requirements

- **Runtime**: Node.js 20+
- **Binary**: Act binary (nektos/act)
- **Services**: Docker daemon (for act)
- **Volumes**: Project directory (`.github/workflows/`)
- **Environment Variables**: `PROJECT_ROOT`, `ACT_BINARY`, `DOCKER_HOST`
- **Commands**: `node index.js` (MCP server startup)

### CI/CD Pipeline Configuration

See `docs/CI.md` for complete workflow implementations. Key requirements:

- **CI Pipeline**: Build without push, test via Docker MCP Gateway
- **CD Pipeline**: Build multi-arch, push to `:latest` tag
- **Image Tag**: `ghcr.io/owner/act-testing-mcp:latest`
- **Testing**: Use `docker mcp tools call` commands
- **Caching**: Registry + GitHub Actions cache

---

## Testing Strategy with Docker MCP Gateway

### Prerequisites for Testing

```bash
# Install Docker MCP Gateway extension
docker extension install docker/mcp-gateway

# Or install via GitHub
docker plugin install docker/mcp-gateway
```

### Test Plan

#### **1. Build and Push Docker Image**

```bash
# Build the Docker image
docker build -t act-testing-mcp:latest .

# Tag for registry (example with GitHub Container Registry)
docker tag act-testing-mcp:latest ghcr.io/garthdb/act-testing-mcp:latest

# Push to registry
docker push ghcr.io/garthdb/act-testing-mcp:latest

# Or use Docker Hub
docker tag act-testing-mcp:latest garthdb/act-testing-mcp:latest
docker push garthdb/act-testing-mcp:latest
```

#### **2. Run with Docker MCP Gateway**

```bash
# Basic run command
docker mcp gateway run --servers docker://garthdb/act-testing-mcp:latest

# With volume mounts for workflows
docker mcp gateway run \
  --servers docker://garthdb/act-testing-mcp:latest \
  --volume ./:/workspace \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --env PROJECT_ROOT=/workspace

# Using GitHub Container Registry
docker mcp gateway run \
  --servers docker://ghcr.io/garthdb/act-testing-mcp:latest

# Multiple servers (if needed in future)
docker mcp gateway run \
  --servers docker://garthdb/act-testing-mcp:latest \
  --servers docker://other-mcp-server:latest
```

#### **3. Verification Steps**

```bash
# 1. Test server discovery
docker mcp gateway list

# 2. Test server health
docker mcp gateway health check

# 3. Test tool discovery
docker mcp gateway tools

# 4. Execute list_workflows tool
docker mcp gateway call-tool \
  --server act-testing-mcp \
  --tool list_workflows

# 5. Execute act_doctor tool
docker mcp gateway call-tool \
  --server act-testing-mcp \
  --tool act_doctor

# 6. Test workflow validation
docker mcp gateway call-tool \
  --server act-testing-mcp \
  --tool validate_workflow \
  --args '{"workflow": "ci.yml"}'

# 7. Test workflow execution (dry-run)
docker mcp gateway call-tool \
  --server act-testing-mcp \
  --tool run_workflow \
  --args '{"workflow": "ci.yml", "event": "push", "dryRun": true}'
```

### Test Script

Create `scripts/test-docker-gateway.sh`:

```bash
#!/bin/bash
set -e

echo "🐳 Testing Docker MCP Gateway Integration"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Docker image
echo -e "${YELLOW}Step 1: Building Docker image...${NC}"
docker build -t act-testing-mcp:test .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi

# Step 2: Test Docker image runs
echo -e "\n${YELLOW}Step 2: Testing Docker image...${NC}"
docker run --rm --entrypoint act act-testing-mcp:test --version

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image works correctly${NC}"
else
    echo -e "${RED}✗ Docker image failed runtime test${NC}"
    exit 1
fi

# Step 3: Push to registry (optional, requires credentials)
if [ -n "$DOCKER_USERNAME" ] && [ -n "$DOCKER_PASSWORD" ]; then
    echo -e "\n${YELLOW}Step 3: Pushing to registry...${NC}"
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    docker tag act-testing-mcp:test "$DOCKER_USERNAME/act-testing-mcp:test"
    docker push "$DOCKER_USERNAME/act-testing-mcp:test"
    echo -e "${GREEN}✓ Image pushed to registry${NC}"
fi

# Step 4: Test with Docker MCP Gateway
echo -e "\n${YELLOW}Step 4: Testing with Docker MCP Gateway...${NC}"
if command -v docker &> /dev/null && docker extension list | grep -q mcp-gateway; then
    echo -e "${GREEN}✓ Docker MCP Gateway extension found${NC}"

    # Test server discovery
    docker mcp gateway list
    echo -e "${GREEN}✓ Server discovered by gateway${NC}"

    # Test tool listing
    docker mcp gateway tools
    echo -e "${GREEN}✓ Tools discovered by gateway${NC}"
else
    echo -e "${YELLOW}⚠ Docker MCP Gateway extension not installed, skipping gateway tests${NC}"
    echo "Install with: docker extension install docker/mcp-gateway"
fi

echo -e "\n${GREEN}🎉 All tests passed!${NC}"
```

### Automated CI Test

Add to `.github/workflows/docker-test.yml`:

```yaml
name: Docker MCP Gateway Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test-docker-gateway:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build Docker image
        run: docker build -t act-testing-mcp:${{ github.sha }} .

      - name: Test Docker image
        run: |
          docker run --rm \
            --entrypoint act \
            act-testing-mcp:${{ github.sha }} \
            --version

      - name: Push Docker image
        if: github.event_name != 'pull_request'
        run: |
          docker tag act-testing-mcp:${{ github.sha }} \
            garthdb/act-testing-mcp:latest
          docker push garthdb/act-testing-mcp:latest

      - name: Test with Docker MCP Gateway (if available)
        continue-on-error: true
        run: |
          # This assumes Docker MCP Gateway is installed
          docker mcp gateway run \
            --servers docker://garthdb/act-testing-mcp:latest \
            --test-timeout 60s
```

### Test Documentation

Add to `docs/DOCKER.md`:

```markdown
## Docker MCP Gateway Integration

### Quick Start

1. Build and push the Docker image:
```bash
docker build -t act-testing-mcp:latest .
docker push act-testing-mcp:latest
```

2. Run with Docker MCP Gateway:
```bash
docker mcp gateway run \
  --servers docker://your-username/act-testing-mcp:latest \
  --volume $(pwd):/workspace
```

3. Verify the server:
```bash
# List available servers
docker mcp gateway list

# List available tools
docker mcp gateway tools

# Test a tool
docker mcp gateway call-tool \
  --server act-testing-mcp \
  --tool list_workflows
```

### Testing Commands

Test the containerized server:
```bash
# Full test suite
./scripts/test-docker-gateway.sh

# Manual testing
docker run --rm -it \
  -v $(pwd):/workspace \
  -v /var/run/docker.sock:/var/run/docker.sock \
  garthdb/act-testing-mcp:latest

# From inside container
act --list
```

### Integration with MCP Clients

Configure your MCP client to use the containerized server:

**Cursor (`.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "act-testing": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/path/to/project:/workspace",
        "-v", "/var/run/docker.sock:/var/run/docker.sock",
        "garthdb/act-testing-mcp:latest"
      ]
    }
  }
}
```

### Troubleshooting

**Issue:** Docker socket permissions
**Solution:** Add user to docker group or use privileged mode

**Issue:** Server not discovered by gateway
**Solution:** Verify Docker socket is mounted correctly

**Issue:** Workflows not found
**Solution:** Ensure project directory is mounted as /workspace
```

---

## Implementation Details

### Dockerfile Structure

```dockerfile
# Stage 1: Build dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --production

# Stage 2: Install act
FROM alpine:latest AS act-installer
RUN apk add --no-cache curl
ARG ACT_VERSION="0.2.61"
RUN curl -sSL "https://github.com/nektos/act/releases/download/v${ACT_VERSION}/act_Linux_x86_64.tar.gz" \
    | tar -xz -C /usr/local/bin act

# Stage 3: Install Docker CLI
FROM alpine:latest AS docker-cli
RUN apk add --no-cache docker-cli

# Stage 4: Final runtime image
FROM node:20-alpine
WORKDIR /app

# Copy dependencies and application
COPY --from=deps /app/node_modules ./node_modules
COPY index.js ./
COPY utils/ ./utils/

# Install act and Docker CLI
COPY --from=act-installer /usr/local/bin/act /usr/local/bin/act
COPY --from=docker-cli /usr/bin/docker /usr/bin/docker

# Create non-root user
RUN addgroup -g 1000 mcp && adduser -D -u 1000 -G mcp mcp
RUN chown -R mcp:mcp /app

USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD node -e "process.exit(0)"

CMD ["node", "index.js"]
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  act-testing-mcp:
    build:
      context: .
      dockerfile: Dockerfile
    image: act-testing-mcp:latest
    container_name: act-testing-mcp
    environment:
      - PROJECT_ROOT=/workspace
      - ACT_BINARY=/usr/local/bin/act
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - ./:/workspace
      - /var/run/docker.sock:/var/run/docker.sock
    stdin_open: true
    tty: true
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

### .dockerignore

```
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
```

---

## Definition of Done

- [ ] Dockerfile created in repository root
- [ ] docker-compose.yml configured with volume mounting
- [ ] `.dockerignore` file created
- [ ] `docs/CI.md` created with CI/CD documentation
- [ ] `docs/DOCKER.md` created with Docker instructions (if needed)
- [ ] README.md updated with Docker section
- [ ] All existing tests pass
- [ ] Docker image builds successfully
- [ ] CI pipeline `.github/workflows/ci.yml` created and working
- [ ] CD pipeline `.github/workflows/cd.yml` created and working
- [ ] CI builds image without pushing (push: false)
- [ ] CD builds and pushes multi-arch image
- [ ] Both pipelines use latest action versions
- [ ] Docker MCP Gateway integration works in CI
- [ ] All MCP tools tested via gateway
- [ ] Performance acceptable
- [ ] Code review approved

---

## Related Documentation

- [CI/CD Pipeline Documentation](./docs/CI.md) - Complete pipeline setup and implementation
- [Docker MCP Gateway - Self-Configured Servers](https://github.com/docker/mcp-gateway/blob/main/docs/self-configured.md)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [nektos/act Installation](https://github.com/nektos/act#installation)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

---

## Estimated Effort

**Story Points:** 15

**Breakdown:**
- Dockerfile creation: 3
- Docker Compose setup: 1
- CI pipeline implementation: 4 ⭐ NEW
- CD pipeline implementation: 3 ⭐ NEW
- Documentation: 2
- Docker MCP Gateway integration and testing: 1
- Manual testing and validation: 1

---

## Dependencies

- Docker MCP Gateway extension installed
- Access to Docker Hub or GitHub Container Registry
- GitHub Actions available for CI/CD

---

## Risk Assessment

**Medium Risk:**

- **Docker-in-Docker (DinD) Setup Complexity**: Running Docker inside Docker can be complex and may require special privileges
- **Docker MCP Gateway Integration**: Testing gateway integration requires proper setup
- **Networking Configuration**: Ensuring proper communication between containerized server and gateway
- **Performance Overhead**: Containerization may introduce latency
- **Registry Access**: Requires credentials and publishing workflow

**Mitigation Strategies:**

- Provide comprehensive troubleshooting documentation
- Include Docker Compose examples to simplify setup
- Conduct thorough testing across different platforms
- Document all prerequisites and setup steps
- Provide fallback approaches if gateway integration fails

---

## Additional Context

### Current MCP Server Tools

1. `list_workflows` - Lists all GitHub Actions workflows in the repository
2. `run_workflow` - Executes workflows locally using act
3. `validate_workflow` - Validates workflow syntax and structure
4. `act_doctor` - Checks system requirements and configuration

### Technical Requirements Summary

- Node.js 20+ runtime
- Act binary for workflow execution
- Docker daemon access
- Read-only access to project directory
- MCP stdio transport protocol
- Health check endpoint

### Containerization Benefits

- **Isolation**: Server runs in isolated environment
- **Portability**: Works on any Docker-enabled platform
- **Scalability**: Can be orchestrated with Kubernetes or Docker Swarm
- **Reproducibility**: Same environment every time
- **Security**: Reduced attack surface through containerization
- **CI/CD Ready**: Easy integration into automated pipelines

This ticket addresses the need to containerize the `act-testing-mcp` server and integrate it with Docker MCP Gateway, following the best practices outlined in the [Docker MCP Gateway documentation](https://github.com/docker/mcp-gateway/blob/main/docs/self-configured.md).

