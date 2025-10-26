
export IMAGE := "oleander/act-testing-mcp:latest"

run-gateway: build-mcp
    docker mcp gateway run --servers "docker://${IMAGE}"
call-mcp:
    docker mcp tools call act_doctor

run-container: build-mcp
    docker run --rm -it \
    -v ~/.docker/run/docker.sock:/var/run/docker.sock:rw \
    -v ~/.cache/actcache:/root/.cache/actcache \
    -v ~/.cache/act:/root/.cache/act \
    -v ./:/app \
    "${IMAGE}"
build-mcp:
    docker build \
        --build-arg MCP_METADATA="$(cat mcp-metadata.yaml)" \
        --build-arg ACT_VERSION="0.2.82" \
        -t "${IMAGE}" .
test-container-act:
    docker run --rm "${IMAGE}" act --version

docker-pull-mcp-image:
    docker pull "ghcr.io/${IMAGE}"
verify-labels: docker-pull-mcp-image
    docker mcp gateway run --servers "docker://${IMAGE}"
