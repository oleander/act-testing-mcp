#!/bin/bash
# Run the act-testing-mcp container with Docker socket mount

# Detect Docker socket location and platform
if [ -S "$HOME/.docker/run/docker.sock" ]; then
  # Docker Desktop on macOS
  DOCKER_SOCK="$HOME/.docker/run/docker.sock"
  EXTRA_ARGS=""
elif [ -S "/var/run/docker.sock" ]; then
  # Native Docker on Linux
  DOCKER_SOCK="/var/run/docker.sock"
  # Use host user/group to match permissions
  EXTRA_ARGS="-u $(id -u):$(id -g)"
else
  echo "Error: Cannot find Docker socket"
  exit 1
fi

echo "Using Docker socket: $DOCKER_SOCK"

docker run --rm -it \
  $EXTRA_ARGS \
  -v "$DOCKER_SOCK:/var/run/docker.sock:rw" \
  ${1:+-v $1:/workspace} \
  ${1:+-e PROJECT_ROOT=/workspace} \
  oleander/act-testing-mcp:latest

