# Repository Guidelines

## Project Structure & Module Organization
The MCP entrypoint lives in `index.js`, exporting the server handlers that expose `act` features. Shared utilities for workflow discovery, execution, and logging are under `utils/`. CLI automation, release scripts, and compatibility tooling reside in `scripts/`. AVA test files mirror the public surface inside `test/` (`*.test.js`), and long-form docs plus setup guides are in `docs/`. Docker-oriented workflows live in the `Justfile`, while metadata used during image builds sits in `mcp-metadata.yaml`.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies; use pnpm to stay aligned with `pnpm-lock.yaml`.
- `pnpm start` launches the MCP locally; `pnpm dev` adds `--inspect` for debugger attachment.
- `pnpm test` runs the AVA suite; add `:watch` to rerun on change.
- `pnpm test:coverage` reports coverage through `c8`.
- `pnpm compatibility:check` compares act compatibility against the saved baseline (`scripts/check-act-compatibility.js`).
- `pnpm format` applies Prettier; use `format:check` in CI to verify formatting.

## Coding Style & Naming Conventions
We publish as an ES module package, so prefer `import`/`export` and named exports from `utils/`. Prettier enforces 2-space indentation, trailing commas where valid, and double quotes; format before committing. Use `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for environment keys (e.g., `PROJECT_ROOT`), and kebab-case for new filenames. Husky plus lint-staged will run Prettier on staged files—avoid bypassing it unless the automation is updated.

## Testing Guidelines
Tests use AVA with descriptive `test()` titles; place new cases beside the module under test inside `test/`. Prefer the async-friendly AVA assertions and mock external subprocesses to keep runs parallel-safe. Run `pnpm test:coverage` before submitting significant changes and keep coverage steady; add focused regression tests when fixing bugs. Document complex test fixtures in `docs/TESTING.md` if they affect contributors.

## Commit & Pull Request Guidelines
Commitlint enforces Conventional Commits with lowercase scopes; follow `type(scope): subject` (example: `feat(server): add workflow summary caching`). Keep subjects under 100 characters and write imperative descriptions. PRs should include a concise summary, testing notes (`pnpm test` output), and linked GitHub issues when available. Update relevant docs (`docs/*.md`, `README.md`) and metadata whenever user-facing behavior changes; include before/after screenshots when altering CLI output.

## Security & Configuration Tips
Keep `mcp-config.example.json` and `mcp-metadata.yaml` in sync when introducing new environment variables or tool capabilities. When touching Docker assets (`Dockerfile`, `Justfile`), verify builds with `pnpm compatibility:check` and `just run-container` to ensure `act` detection still succeeds. Avoid committing secrets; rely on env variables documented in `docs/SETUP.md`.
