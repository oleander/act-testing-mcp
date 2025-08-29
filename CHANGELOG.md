# act-testing-mcp

## 1.1.2

### Patch Changes

- [#8](https://github.com/GarthDB/act-testing-mcp/pull/8) [`1b67363`](https://github.com/GarthDB/act-testing-mcp/commit/1b673639d0521b7e234ab21c93acc798d0fa8ada) Thanks [@GarthDB](https://github.com/GarthDB)! - fix: update npm badge and add status badges
  - Replace broken badge.fury.io npm badge with reliable shields.io version
  - Add npm downloads badge to show package adoption
  - Add CI status badge for build health visibility
  - Improve README presentation and discoverability

## 1.1.1

### Patch Changes

- [#5](https://github.com/GarthDB/act-testing-mcp/pull/5) [`2957e9c`](https://github.com/GarthDB/act-testing-mcp/commit/2957e9c3c7d3cae3bbeaff0cc4e8074c3e38f92a) Thanks [@GarthDB](https://github.com/GarthDB)! - Simplify MCP configuration to match community standards
  - Remove PROJECT_ROOT requirement from default configuration
  - Follow Browser MCP pattern with simple npx setup
  - Add PROJECT_ROOT as optional override for specific use cases
  - Update example configuration to be path-agnostic
  - Reference Browser MCP documentation for consistency

  This makes the setup much simpler for most users while still providing flexibility when needed. The new default configuration works out of the box without requiring project-specific paths, following established MCP community patterns.

## 1.1.0

### Minor Changes

- [#3](https://github.com/GarthDB/act-testing-mcp/pull/3) [`bb768a0`](https://github.com/GarthDB/act-testing-mcp/commit/bb768a0d42a4ae065fdc26630981535e52be18d4) Thanks [@GarthDB](https://github.com/GarthDB)! - Add npm provenance support for enhanced supply-chain security
  - Add `--provenance` flag to changeset publish command
  - Configure `publishConfig.provenance: true` in package.json
  - Add `id-token: write` permission to release workflow
  - Enables verifiable attestations for published packages

  This implements npm provenance as described in https://docs.npmjs.com/generating-provenance-statements, providing:
  - Verifiable link to package source code and build instructions
  - Public transparency log via Sigstore
  - Enhanced supply-chain security for package consumers
  - Automatic attestation generation during CI/CD publishing

### Patch Changes

- [#3](https://github.com/GarthDB/act-testing-mcp/pull/3) [`8587e72`](https://github.com/GarthDB/act-testing-mcp/commit/8587e720f6e8b8b192f9c3d73d74ed2825f62778) Thanks [@GarthDB](https://github.com/GarthDB)! - Improve configuration documentation and add GitHub PR template
  - Add npx as the recommended installation method to resolve IDE compatibility issues
  - Provide three configuration options: npx (recommended), global, and local development
  - Update example configuration to use npx by default
  - Add comprehensive GitHub PR template with checklists and sections
  - Reference continuedev/continue#4791 about NPX availability problems in IDEs

  This makes the MCP server more reliable across different IDE environments and provides better guidance for contributors.

## 1.0.0

### Patch Changes

- [#1](https://github.com/GarthDB/act-testing-mcp/pull/1) [`6fc2d87`](https://github.com/GarthDB/act-testing-mcp/commit/6fc2d87991513a0f220ea99519068b0b7399d42e) Thanks [@GarthDB](https://github.com/GarthDB)! - Add comprehensive development tooling setup
  - Add changeset support for automated version management and releases
  - Add commitlint with conventional commit message validation
  - Add prettier with automatic code formatting on commit
  - Add husky for git hooks (pre-commit and commit-msg)
  - Add GitHub Actions workflows for CI/CD and automated releases
  - Set up lint-staged for pre-commit code formatting
  - Configure proper release automation with changesets and GitHub Actions
