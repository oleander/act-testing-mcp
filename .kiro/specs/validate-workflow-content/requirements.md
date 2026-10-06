# Requirements Document

## Introduction

This document specifies the requirements for adding a `validate_workflow_content` tool to the act-testing-mcp server. The tool will enable validation of GitHub Actions workflow YAML content provided as a string, without requiring the workflow to exist as a file in the repository. This addresses limitations in multi-agent systems and dynamic workflow generation scenarios where workflows are created programmatically and need validation before being written to disk.

## Glossary

- **MCP Server**: The Model Context Protocol server that provides tools to AI assistants for testing GitHub Actions workflows locally
- **act**: The nektos/act tool that runs GitHub Actions workflows locally using Docker
- **Workflow YAML Content**: A complete GitHub Actions workflow definition in YAML format provided as a string
- **Temporary Workflow File**: A temporary file created in `.github/workflows/` directory to enable validation via act
- **Validation Result**: The output from act indicating whether the workflow syntax and structure are valid

## Requirements

### Requirement 1

**User Story:** As a developer using an AI assistant with multi-agent systems, I want to validate dynamically generated workflow YAML content, so that I can verify workflow correctness before creating files

#### Acceptance Criteria

1. WHEN a user provides workflow YAML content as a string, THE MCP Server SHALL accept the content through a `validate_workflow_content` tool
2. THE MCP Server SHALL create a temporary workflow file in the `.github/workflows/` directory with the provided YAML content
3. THE MCP Server SHALL invoke act to validate the temporary workflow file
4. THE MCP Server SHALL return validation results in the same format as the existing `validate_workflow` tool
5. THE MCP Server SHALL delete the temporary workflow file after validation completes

### Requirement 2

**User Story:** As a developer, I want the new tool to handle errors gracefully, so that temporary files are cleaned up even when validation fails

#### Acceptance Criteria

1. IF validation encounters an error, THEN THE MCP Server SHALL ensure the temporary file is deleted
2. THE MCP Server SHALL use a try-finally block to guarantee cleanup of temporary files
3. IF file cleanup fails, THE MCP Server SHALL log the error without failing the validation operation
4. THE MCP Server SHALL return meaningful error messages when validation fails

### Requirement 3

**User Story:** As a developer, I want the tool to generate unique temporary filenames, so that concurrent validations do not conflict

#### Acceptance Criteria

1. THE MCP Server SHALL generate unique temporary filenames using timestamps or random identifiers
2. THE MCP Server SHALL ensure temporary filenames follow the pattern `temp-validate-*.yml`
3. WHEN multiple validation requests occur simultaneously, THE MCP Server SHALL handle each with a distinct temporary file

### Requirement 4

**User Story:** As a developer, I want the tool to be documented, so that I understand how to use it

#### Acceptance Criteria

1. THE MCP Server SHALL include the `validate_workflow_content` tool in the README.md documentation
2. THE documentation SHALL include the tool name, description, parameters, and usage examples
3. THE documentation SHALL explain the difference between `validate_workflow` and `validate_workflow_content`

### Requirement 5

**User Story:** As a developer, I want the tool to be tested, so that I can trust its reliability

#### Acceptance Criteria

1. THE MCP Server SHALL include unit tests for the `validate_workflow_content` tool in `test/index.test.js`
2. THE tests SHALL verify successful validation of valid workflow content
3. THE tests SHALL verify error handling for invalid workflow content
4. THE tests SHALL verify temporary file cleanup occurs in both success and failure scenarios
5. THE tests SHALL follow existing test patterns in the codebase

### Requirement 6

**User Story:** As a developer, I want the tool to reuse existing validation logic, so that behavior is consistent across validation tools

#### Acceptance Criteria

1. THE MCP Server SHALL reuse the validation logic from the existing `validate_workflow` tool
2. THE MCP Server SHALL use the same act command structure for validation
3. THE MCP Server SHALL return validation results in the identical format as `validate_workflow`
