
IMAGE := "oleander/act-testing-mcp:latest"

run-gateway:
    docker mcp gateway run --servers "docker://${IMAGE}"
call-mcp:
    docker mcp tools call act_doctor

run-container: build-mcp
    docker run --rm -it -v /Users/linus/.docker/run/docker.sock:/var/run/docker.sock:rw -v ./:/app "${IMAGE}"
build-mcp:
    docker build -t "${IMAGE}" .
