# GitHub Secrets Setup Guide

This guide walks you through setting up the necessary secrets for automated npm publishing and GitHub releases.

## Required Secrets

### 1. NPM_TOKEN (Required for npm publishing)

#### Step 1: Create npm Access Token

1. **Login to npm**:

   ```bash
   npm login
   ```

   Enter your npm credentials when prompted.

2. **Create an automation token**:
   - Go to https://www.npmjs.com/settings/tokens
   - Click "Generate New Token"
   - Select "Automation" token type (required for CI/CD publishing)
   - Add a description like "act-testing-mcp GitHub Actions"
   - Click "Generate Token"
   - **Copy the token immediately** (starts with `npm_`)

#### Step 2: Add Token to GitHub

1. Go to https://github.com/GarthDB/act-testing-mcp/settings/secrets/actions
2. Click "New repository secret"
3. **Name**: `NPM_TOKEN`
4. **Secret**: Paste your npm token (e.g., `npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
5. Click "Add secret"

### 2. GITHUB_TOKEN (Automatic)

The `GITHUB_TOKEN` is automatically provided by GitHub Actions. No setup required.

## How the Release Process Works

### 1. Development Workflow

```bash
# Make changes and commit with conventional commits
git commit -m "feat: add new feature"

# Create a changeset for the change
pnpm changeset
# Follow the prompts to describe your changes

# Push changes
git push
```

### 2. Automated Release Process

1. **When you merge changes with changesets**:
   - GitHub Actions creates a "Version Packages" PR
   - This PR updates package.json version and CHANGELOG.md

2. **When you merge the "Version Packages" PR**:
   - GitHub Actions automatically:
     - Publishes the package to npm
     - Creates a GitHub release with changelog
     - Tags the release

### 3. Manual Release (if needed)

```bash
# Create a changeset manually
pnpm changeset

# Version the packages locally (optional, normally done by CI)
pnpm changeset:version

# Publish (normally done by CI)
pnpm changeset:publish
```

## Testing the Setup

### 1. Verify npm Token

You can test your npm token works:

```bash
# Check if you can access npm with your token
npm whoami
```

### 2. Test Release Workflow

1. Make a small change
2. Create a changeset: `pnpm changeset`
3. Commit and push to main
4. Check if GitHub Actions creates a "Version Packages" PR
5. Merge the PR and verify publishing works

## Troubleshooting

### NPM Token Issues

- **401 Unauthorized**: Token is invalid or expired
- **403 Forbidden**: Token doesn't have publish permissions
- **404 Not Found**: Package name might be taken

### GitHub Actions Issues

- Check the Actions tab for detailed error logs
- Ensure secrets are correctly named (case-sensitive)
- Verify the token has proper permissions

### Package Publishing Issues

- Ensure package name is unique on npm
- Check if you have permissions to publish under that scope
- Verify package.json has correct repository and author info

## Security Best Practices

1. **Never commit tokens to git**
2. **Use automation tokens for CI/CD** (not personal tokens)
3. **Regularly rotate tokens** (every 6-12 months)
4. **Monitor npm package downloads** for suspicious activity
5. **Enable 2FA on npm account**

## What Gets Published

The published package includes:

- Main MCP server (`index.js`)
- Utility modules (`utils/`)
- Documentation (`README.md`, `docs/`)
- License and package metadata
- Sample configurations

**Excluded from npm package:**

- Tests (`test/`)
- Development configs (`.prettier*`, `commitlint.config.cjs`)
- Git hooks (`.husky/`)
- GitHub workflows (`.github/`)
- Cursor configuration (`.cursor/`)

This is controlled by the `files` field in package.json and `.npmignore` if present.
