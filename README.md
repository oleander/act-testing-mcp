[![Verified on MseeP](https://mseep.ai/badge.svg)](https://mseep.ai/app/f18a0332-2186-49a9-a29d-c0de85307440)

# Act Testing MCP

[![npm version](https://img.shields.io/npm/v/act-testing-mcp.svg)](https://www.npmjs.com/package/act-testing-mcp)
[![npm downloads](https://img.shields.io/npm/dm/act-testing-mcp.svg)](https://www.npmjs.com/package/act-testing-mcp)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![CI](https://github.com/GarthDB/act-testing-mcp/workflows/CI/badge.svg)](https://github.com/GarthDB/act-testing-mcp/actions)

Model Context Protocol (MCP) server for testing GitHub Actions workflows locally using [nektos/act](https://github.com/nektos/act).

## Purpose

This MCP provides AI assistants (like Claude) with direct access to test GitHub Actions workflows locally, eliminating trial-and-error development cycles when working with CI/CD pipelines.

## Features

- **🔍 List Workflows**: Discover all available GitHub Actions workflows in any repository
- **▶️ Run Workflows**: Execute workflows locally with act
- **✅ Validate Syntax**: Check workflow files for errors before committing
- **🎭 Custom Events**: Test workflows with custom event data to simulate different scenarios
- **🐛 Debug Support**: Detailed logging and error reporting
- **📊 Dependency Monitoring**: Track `act` compatibility and detect breaking changes
- **🔐 Supply Chain Security**: Published with npm provenance attestations for verifiable builds

## Prerequisites

- **Docker Desktop** (running)
- **nektos/act** installed ([Installation Guide](https://github.com/nektos/act#installation))
- **Node.js 20+**

### Installing nektos/act

```bash
# macOS
brew install act

# Linux (with curl)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows (with chocolatey)
choco install act-cli

# Or download from releases
# https://github.com/nektos/act/releases
```

## Installation

```bash
npm install -g act-testing-mcp
```

## Docker

Run this MCP server as a container for use with the Docker MCP Gateway or directly via Docker.

Quick start:

```bash
# Build the image
docker build -t act-testing-mcp:latest .

# Or run with docker-compose
docker compose up --build

# Use with Docker MCP Gateway (mount project and Docker socket)
docker mcp gateway run \
  --servers docker://act-testing-mcp:latest \
  --volume $(pwd):/workspace \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --env PROJECT_ROOT=/workspace
```

See `docs/DOCKER.md` for detailed instructions, troubleshooting, and CI setup.

### Verifying Package Integrity

This package is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) for enhanced supply-chain security. You can verify the package's attestations:

```bash
npm audit signatures
```

Or clone and run locally:

```bash
git clone https://github.com/GarthDB/act-testing-mcp.git
cd act-testing-mcp
npm install
```

## Configuration

### MCP Setup

Add to your MCP configuration (e.g., `.cursor/mcp.json` for Cursor IDE):

#### Option 1: Using npx (Recommended)

```json
{
  "mcpServers": {
    "act-testing": {
      "command": "npx",
      "args": ["act-testing-mcp"]
    }
  }
}
```

#### Option 2: Using global installation

```json
{
  "mcpServers": {
    "act-testing": {
      "command": "act-testing-mcp"
    }
  }
}
```

#### Option 3: With custom project path (if needed)

```json
{
  "mcpServers": {
    "act-testing": {
      "command": "npx",
      "args": ["act-testing-mcp"],
      "env": {
        "PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

#### Option 4: Local development

```json
{
  "mcpServers": {
    "act-testing": {
      "command": "node",
      "args": ["./path/to/act-testing-mcp/index.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/your/project",
        "ACT_BINARY": "act"
      }
    }
  }
}
```

> **Note**: Using `npx` (Option 1) is recommended as it avoids PATH issues and ensures you always use the latest version. The MCP server automatically detects the current working directory, so `PROJECT_ROOT` is only needed if you want to override the default behavior. This approach mirrors other MCP servers like [Browser MCP](https://docs.browsermcp.io/setup-server#cursor) and resolves common NPX availability problems as mentioned in [continuedev/continue#4791](https://github.com/continuedev/continue/issues/4791).

### Act Configuration

Create an `.actrc` file in your project root (copy from the example):

```bash
# Copy example configuration and customize paths
cp mcp-config.example.json .cursor/mcp.json
# Edit .cursor/mcp.json to set your PROJECT_ROOT path

# Copy act configuration (optional)
cp .actrc /path/to/your/project/.actrc
```

## Tools Provided

### `list_workflows`

Lists all available GitHub Actions workflows in the repository.

**Parameters:** None

**Example:**

```
📋 **CI** (ci.yml)
   Job: test (test)
   Events: push, pull_request

📋 **Release** (release.yml)
   Job: release (release)
   Events: workflow_dispatch
```

### `run_workflow`

Runs a workflow locally using act.

**Parameters:**

- `workflow` (required): Workflow file name or job ID
- `event` (optional): Event type (push, pull_request, etc.)
- `dryRun` (optional): Show execution plan without running
- `verbose` (optional): Enable detailed output
- `env` (optional): Environment variables
- `secrets` (optional): Secrets to provide
- `eventData` (optional): Custom event data for testing

**Examples:**

```bash
# Run CI workflow
run_workflow workflow="ci.yml" event="push"

# Dry run with custom event data
run_workflow workflow="ci.yml" event="pull_request" dryRun=true eventData='{"number": 123}'

# Run with environment variables
run_workflow workflow="release.yml" env='{"NODE_ENV": "production"}'
```

### `validate_workflow`

Validates workflow syntax and structure.

**Parameters:**

- `workflow` (required): Workflow file name to validate

### `act_doctor`

Checks act configuration and Docker setup.

**Parameters:** None

## Usage Examples

### With AI Assistant (Claude)

Once configured, you can ask your AI assistant to test workflows directly:

- _"Test my CI workflow"_
- _"Run the release workflow in dry-run mode"_
- _"Check if my new workflow file is valid"_
- _"Test the pull request workflow with custom PR data"_

### Direct Usage

```bash
# Start the MCP server
npm start

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Debug mode
npm run dev
```

## Development

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Testing Coverage

The tool includes comprehensive testing:

- **Unit tests** with AVA framework
- **Integration testing** with real act and Docker
- **Code coverage** with c8 (targeting 70%+ for core logic)
- **ES modules** with native Node.js support

### Compatibility Monitoring

Track act compatibility over time:

```bash
# Create baseline
npm run compatibility:baseline

# Check for changes
npm run compatibility:check

# Generate detailed report
npm run compatibility:report
```

## Project Structure

```
act-testing-mcp/
├── index.js              # Main MCP server
├── package.json          # Dependencies and scripts
├── README.md             # This file
├── LICENSE               # Apache 2.0 license
├── .actrc                # Act configuration example
├── ava.config.js         # Test configuration
├── mcp-config.example.json # MCP configuration example
├── utils/                # Utility modules
│   ├── act-helpers.js    # Core act integration
│   └── act-monitor.js    # Compatibility monitoring
├── scripts/              # Utility scripts
│   └── check-act-compatibility.js
├── test/                 # Test suites
│   ├── index.test.js
│   ├── act-compatibility.test.js
│   ├── act-monitor.test.js
│   └── utils.test.js
└── docs/                 # Additional documentation
    ├── SETUP.md
    ├── GUIDE.md
    ├── TESTING.md
    └── DEPENDENCY_MONITORING.md
```

## Troubleshooting

### Docker Issues

```bash
# Check Docker is running
docker ps

# Pull required images
docker pull catthehacker/ubuntu:act-latest
```

### Act Issues

```bash
# Check act installation
act --version

# Test act with simple workflow
act --list
```

### MCP Connection Issues

1. Verify the MCP configuration file path
2. Check that Node.js path is correct
3. Ensure PROJECT_ROOT environment variable is set
4. Check that the project has a `.github/workflows/` directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [nektos/act](https://github.com/nektos/act) - Run your GitHub Actions locally
- [Model Context Protocol](https://github.com/modelcontextprotocol) - Protocol for AI assistant tool integration

## Support

- Create an [issue](https://github.com/GarthDB/act-testing-mcp/issues) for bug reports or feature requests
- Check the [documentation](docs/) for detailed guides
- Review existing [issues](https://github.com/GarthDB/act-testing-mcp/issues) for solutions

---

**Note**: This tool was originally developed for the [Adobe Spectrum Tokens](https://github.com/adobe/spectrum-tokens) project and has been extracted as a standalone, reusable MCP server.
