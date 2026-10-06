#!/bin/bash
# Read the metadata YAML file and pass it as a build argument

METADATA=$(cat mcp-metadata.yaml)

docker build \
  --build-arg MCP_METADATA="$METADATA" \
  --build-arg ACT_VERSION="0.2.82" \
  -t oleander/act-testing-mcp:latest \
  .

