---
"act-testing-mcp": patch
---

Simplify MCP configuration to match community standards

- Remove PROJECT_ROOT requirement from default configuration
- Follow Browser MCP pattern with simple npx setup
- Add PROJECT_ROOT as optional override for specific use cases
- Update example configuration to be path-agnostic
- Reference Browser MCP documentation for consistency

This makes the setup much simpler for most users while still providing flexibility when needed. The new default configuration works out of the box without requiring project-specific paths, following established MCP community patterns.
