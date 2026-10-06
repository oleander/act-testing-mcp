# 🎫 JIRA TICKET: Implement CI/CD Pipelines for Docker Containerization

**Issue Type:** Story
**Priority:** High
**Epic Link:** Docker Integration & Deployment
**Components:** `CI/CD`, `Docker`, `GitHub Actions`, `MCP Gateway`
**Labels:** `ci-cd`, `docker`, `github-actions`, `mcp-gateway`, `automation`
**Sprint:** Current Sprint

---

## Title

Implement CI/CD Pipelines for Docker Containerized MCP Server

---

## Story

**As a** developer using the Docker MCP Gateway
**I want** automated CI/CD pipelines that build and test containerized images
**So that** the act-testing-mcp server can be continuously deployed without manual intervention

---

## Background & Context

The act-testing-mcp MCP server has been containerized with a Dockerfile. This ticket implements the CI/CD pipelines that:
- Build Docker images on every push to main and PRs
- Test the containerized server using Docker MCP Gateway
- Automatically deploy multi-architecture images to GHCR after successful CI

Complete implementation details are in [`docs/CI.md`](./docs/CI.md).

---

## Business Value

- **Automated Testing**: Every commit is automatically tested
- **Continuous Deployment**: Images automatically deployed on main branch
- **Multi-Architecture Support**: ARM and AMD64 images built automatically
- **Consistent Quality**: Same testing approach for local and CI
- **Reduced Manual Work**: No manual building or deployment steps
- **Fast Feedback Loop**: Developers see test results immediately

---

## Acceptance Criteria

### 1. CI Pipeline (`.github/workflows/ci.yml`)

#### Workflow Configuration
- [ ] Workflow triggers on push to main
- [ ] Workflow triggers on pull requests to main
- [ ] Uses concurrency to cancel in-progress runs
- [ ] Environment variable: `IMAGE_TAG=ghcr.io/owner/act-testing-mcp:latest`

#### Build Job
- [ ] Job named "Build Docker Image"
- [ ] Runs on `ubuntu-latest`
- [ ] Uses `actions/checkout@v4` (no fetch-depth)
- [ ] Uses `docker/setup-buildx-action@v3`
- [ ] Uses `docker/login-action@v3` for GHCR authentication
- [ ] Uses `docker/build-push-action@v6` to build image
- [ ] Build args: `ACT_VERSION=0.2.61`
- [ ] **push: false** - CI does NOT push images
- [ ] Tags: `ghcr.io/owner/act-testing-mcp:latest`
- [ ] Cache from: `type=gha, type=registry,ref=IMAGE_TAG`
- [ ] Cache to: `type=gha,mode=max`
- [ ] Permissions: `contents: read, packages: write`

#### Test Job
- [ ] Job named "Test MCP Server Tools"
- [ ] Runs on `ubuntu-latest`
- [ ] **needs: build** - depends on build job
- [ ] **continue-on-error: true** - non-blocking tests
- [ ] Uses same setup actions as build
- [ ] Pulls/loads the built image
- [ ] Installs Docker MCP Gateway extension
- [ ] Starts gateway: `docker mcp gateway run --servers docker://IMAGE_TAG &`
- [ ] Waits for gateway startup (sleep 10)
- [ ] Tests **all 5 MCP tools** via `docker mcp tools call`:
  - [ ] `list_workflows`
  - [ ] `act_doctor`
  - [ ] `validate_workflow`
  - [ ] `validate_workflow_content`
  - [ ] `run_workflow` (dry-run)
- [ ] Container health check using `gharlan/docker-healthcheck-action@v1`
- [ ] All test steps use `continue-on-error: true`

### 2. CD Pipeline (`.github/workflows/cd.yml`)

#### Workflow Configuration
- [ ] Workflow triggers after CI completion: `workflow_run: workflows: [CI]`
- [ ] Only runs when CI succeeded
- [ ] Only runs on main branch (check `github.event.workflow_run.head_branch`)
- [ ] Environment variable: `BASE_IMAGE_TAG=ghcr.io/owner/act-testing-mcp:latest`
- [ ] Permissions: `contents: read, packages: write`

#### Build Job
- [ ] Job named "Build and Push Multi-Arch Image"
- [ ] Runs on `ubuntu-latest`
- [ ] Checks out using `github.event.workflow_run.head_sha`
- [ ] Uses same setup actions as CI
- [ ] Builds for **both architectures**: `platforms: linux/amd64,linux/arm64`
- [ ] **push: true** - CD DOES push images
- [ ] Tags: `ghcr.io/owner/act-testing-mcp:latest`
- [ ] Cache from: `type=gha, type=registry,ref=BASE_IMAGE_TAG`
- [ ] Cache to: `type=gha,mode=max`

### 3. Documentation

- [ ] Create `docs/CI.md` with complete CI/CD documentation
- [ ] Local testing matches CI workflow approach
- [ ] Document all 5 MCP tools being tested
- [ ] Include troubleshooting section
- [ ] Document multi-architecture build process
- [ ] Explain Docker MCP Gateway integration

### 4. Testing & Validation

- [ ] CI pipeline runs successfully on all pushes
- [ ] Test job executes all 5 tool tests
- [ ] CD pipeline triggers after successful CI
- [ ] Multi-arch image builds successfully
- [ ] Image pushed to GHCR with `:latest` tag
- [ ] Image works with Docker MCP Gateway
- [ ] All tests pass (or fail non-blockingly)

---

## Technical Specifications

### Workflow Triggers

#### CI Pipeline
```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

#### CD Pipeline
```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
```

### Key Actions & Versions

- `actions/checkout@v4`
- `docker/setup-buildx-action@v3`
- `docker/login-action@v3`
- `docker/build-push-action@v6`
- `gharlan/docker-healthcheck-action@v1`

### Testing Commands

All tests use `docker mcp tools call`:
```bash
docker mcp tools call list_workflows
docker mcp tools call act_doctor
docker mcp tools call validate_workflow '{"workflow": "ci.yml"}'
docker mcp tools call validate_workflow_content '{"yamlContent": "..."}'
docker mcp tools call run_workflow '{"workflow": "ci.yml", "event": "push", "dryRun": true}'
```

---

## Implementation Details

### CI Pipeline Flow

1. **Checkout** code
2. **Setup** Docker Buildx
3. **Login** to GitHub Container Registry
4. **Build** Docker image (no push)
5. **Install** Docker MCP Gateway
6. **Pull** built image
7. **Start** gateway with image
8. **Test** all 5 MCP tools via gateway
9. **Health check** container

### CD Pipeline Flow

1. **Trigger** after CI completion
2. **Checkout** specific commit SHA
3. **Setup** Docker Buildx
4. **Login** to GHCR
5. **Build** multi-arch image
6. **Push** to GHCR with `:latest` tag
7. **Cache** for future builds

### Image Tagging Strategy

- **CI**: Builds but doesn't push
- **CD**: Pushes to `ghcr.io/owner/act-testing-mcp:latest`
- **Latest**: Always points to most recent main branch commit
- **Replaces**: Each merge to main replaces the `:latest` tag

---

## Definition of Done

- [ ] CI workflow `.github/workflows/ci.yml` created
- [ ] CD workflow `.github/workflows/cd.yml` created
- [ ] Both workflows use latest action versions
- [ ] CI builds image without pushing
- [ ] CD builds and pushes multi-arch image
- [ ] All 5 MCP tools tested via Docker MCP Gateway
- [ ] Tests use `continue-on-error: true`
- [ ] Health check included
- [ ] `docs/CI.md` created with complete documentation
- [ ] Local testing instructions provided
- [ ] CI pipeline runs successfully
- [ ] CD pipeline runs after CI
- [ ] Multi-arch image published to GHCR
- [ ] No linter errors
- [ ] Code review approved

---

## Related Documentation

- [CI/CD Pipeline Documentation](./docs/CI.md) - Complete implementation guide
- [JIRA.md](./JIRA.md) - Docker containerization ticket
- [Docker MCP Gateway Docs](https://github.com/docker/mcp-gateway/blob/main/docs/self-configured.md)

---

## Estimated Effort

**Story Points:** 8

**Breakdown:**
- CI pipeline implementation: 3
- CD pipeline implementation: 2
- Testing and validation: 1
- Documentation: 1
- Integration testing: 1

---

## Dependencies

- Dockerfile must exist (from main JIRA ticket)
- GitHub Container Registry access
- Docker MCP Gateway available in CI environment
- GitHub Actions enabled for repository

---

## Risks

**Low-Medium Risk:**
- Docker MCP Gateway may not be available in all CI environments
- Multi-arch builds can be slow
- Test failures could block deployments

**Mitigation:**
- Use `continue-on-error: true` for non-blocking tests
- Cache aggressively for fast builds
- Document troubleshooting steps

---

## Success Metrics

- CI pipeline completes in under 10 minutes
- All tests run (some may fail, that's OK)
- CD pipeline triggers automatically after CI
- Multi-arch image publishes successfully
- Image size remains under 500MB
- Zero manual deployment steps required

---

## Additional Notes

### Why Two Pipelines?

- **CI**: Tests everything without pushing (can run on forks/PRs)
- **CD**: Only pushes to registry after validation (security + control)
- **Separation**: Allows testing without publishing

### Why `continue-on-error: true`?

- Tests are exploratory/non-blocking
- Allow partial failures
- CI succeeds even if some tests fail
- Focus on critical functionality first

### Why Multi-Architecture?

- Docker MCP Gateway users may be on different platforms
- Supports both ARM64 and AMD64
- Docker automatically selects correct architecture
- Future-proof for edge devices

---

**Created:** 2025-01-XX
**Status:** Ready for Implementation
**Assignee:** TBD

