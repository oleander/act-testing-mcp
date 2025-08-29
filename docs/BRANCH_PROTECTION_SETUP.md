# Branch Protection Setup Guide

This guide walks you through setting up branch protections for the `main` branch in the act-testing-mcp repository.

## Steps to Enable Branch Protection

1. **Navigate to Repository Settings**
   - Go to https://github.com/GarthDB/act-testing-mcp
   - Click on the "Settings" tab (you need admin access)

2. **Access Branch Protection Rules**
   - In the left sidebar, click "Branches"
   - Click "Add branch protection rule"

3. **Configure Branch Protection Rule**

   **Branch name pattern:** `main`

   **Protect matching branches - Recommended settings:**
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1`
     - ✅ Dismiss stale reviews when new commits are pushed
     - ✅ Require review from code owners (if you add a CODEOWNERS file)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - **Required status checks:**
       - `test` (from CI workflow)
       - `Check formatting` (from CI workflow)
       - `Run tests with coverage` (from CI workflow)
       - `Check act compatibility` (from CI workflow)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require signed commits** (optional but recommended)
   - ✅ **Require linear history** (optional, prevents merge commits)
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict pushes that create files larger than 100MB**

4. **Additional Security Settings (Optional)**

   In Repository Settings → General → Pull Requests:
   - ✅ **Allow auto-merge**
   - ✅ **Automatically delete head branches**
   - ✅ **Allow merge commits** (uncheck if you want linear history)
   - ✅ **Allow squash merging**
   - ✅ **Allow rebase merging**

## CODEOWNERS File (Optional)

Create a `.github/CODEOWNERS` file to automatically request reviews:

```
# Global owners
* @GarthDB

# MCP server code
index.js @GarthDB
utils/ @GarthDB

# CI/CD workflows
.github/workflows/ @GarthDB

# Development configuration
package.json @GarthDB
.changeset/ @GarthDB
```

## Result

After setting up these protections:

- No direct pushes to `main` branch
- All changes must go through pull requests
- Pull requests must pass all CI checks
- Pull requests require at least 1 approval
- Conversations must be resolved before merging
- Stale reviews are dismissed when new commits are pushed

This ensures code quality and prevents accidental breaking changes to the main branch.

## Testing the Protection

1. Create a new branch: `git checkout -b test-protection`
2. Make a small change and commit it
3. Push the branch and create a pull request
4. Verify that you cannot merge until CI passes and reviews are complete
