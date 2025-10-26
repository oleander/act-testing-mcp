
export IMAGE := "oleander/act-testing-mcp:latest"

run-gateway:
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
        --build-arg MCP_METADATA="$(cat mcp-metadata.json)" \
        -t "${IMAGE}" .
test-container-act:
    docker run --rm "${IMAGE}" act --version
