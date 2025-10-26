## Docker MCP Gateway Integration

### Quick Start

1. Build the Docker image:
```bash
docker build -t act-testing-mcp:latest .
```

2. Run with Docker MCP Gateway:
```bash
docker mcp gateway run \
  --servers docker://your-username/act-testing-mcp:latest \
  --volume $(pwd):/workspace \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --env PROJECT_ROOT=/workspace
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

### Running Locally (docker-compose)

```bash
docker compose up --build
```

This composes the service with:
- PROJECT_ROOT mounted at `/workspace`
- Docker socket mounted at `/var/run/docker.sock`
- `ACT_BINARY` set to `/usr/local/bin/act`

### Image Contents

- Node.js 20 (Alpine)
- `@modelcontextprotocol/sdk` runtime deps (production only)
- `nektos/act` CLI (arch-aware install)
- Docker CLI (for diagnostics via `act_doctor`)
- Non-root `mcp` user
- HEALTHCHECK (basic Node liveness)

### Environment Variables

- `PROJECT_ROOT` (default `/workspace`) – project folder containing `.github/workflows/`
- `ACT_BINARY` (default `/usr/local/bin/act`) – path to `act`
- `NODE_ENV` (default `production`)

### Volumes

- `./:/workspace` – mount your repository so workflows are visible to `act`
- `/var/run/docker.sock:/var/run/docker.sock` – allow `act` to run Docker actions

### Troubleshooting

- Issue: Docker socket permissions
  - Solution: run with mounted `/var/run/docker.sock`; ensure your user can access it or rely on container defaults
- Issue: Server not discovered by gateway
  - Solution: verify Docker MCP Gateway is installed; confirm volumes and env vars are set; check logs
- Issue: Workflows not found
  - Solution: ensure your project is mounted at `/workspace` and contains `.github/workflows/`

### Testing Commands

Run the quick check of the bundled tools:
```bash
docker run --rm \
  -v $(pwd):/workspace \
  -v /var/run/docker.sock:/var/run/docker.sock \
  act-testing-mcp:latest node -e "console.log('ok')"

# Verify act is available in the image
docker run --rm --entrypoint act act-testing-mcp:latest --version
```

### Integration with MCP Clients

Configure an MCP client to use the image.

Example for Cursor (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "act-testing": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/absolute/path/to/project:/workspace",
        "-v", "/var/run/docker.sock:/var/run/docker.sock",
        "act-testing-mcp:latest"
      ]
    }
  }
}
```

### Docker MCP Gateway Test Plan

1) Build and optionally tag for registry
```bash
docker build -t act-testing-mcp:latest .
# docker tag act-testing-mcp:latest ghcr.io/<namespace>/act-testing-mcp:latest
# docker push ghcr.io/<namespace>/act-testing-mcp:latest
```

2) Run with Gateway and volumes
```bash
docker mcp gateway run \
  --servers docker://act-testing-mcp:latest \
  --volume $(pwd):/workspace \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --env PROJECT_ROOT=/workspace
```

3) Verify
```bash
docker mcp gateway list
docker mcp gateway tools
docker mcp gateway call-tool --server act-testing-mcp --tool list_workflows
```
