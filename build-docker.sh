#!/bin/bash
# Read the metadata JSON file and pass it as a build argument

METADATA=$(cat mcp-metadata.json)

docker build \
  --build-arg METADATA="$METADATA" \
  -t oleander/act-testing-mcp:latest \
  .

