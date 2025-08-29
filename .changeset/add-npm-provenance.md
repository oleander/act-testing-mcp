---
"act-testing-mcp": minor
---

Add npm provenance support for enhanced supply-chain security

- Add `--provenance` flag to changeset publish command
- Configure `publishConfig.provenance: true` in package.json
- Add `id-token: write` permission to release workflow
- Enables verifiable attestations for published packages

This implements npm provenance as described in https://docs.npmjs.com/generating-provenance-statements, providing:

- Verifiable link to package source code and build instructions
- Public transparency log via Sigstore
- Enhanced supply-chain security for package consumers
- Automatic attestation generation during CI/CD publishing
