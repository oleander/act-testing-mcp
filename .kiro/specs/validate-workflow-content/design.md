# Design Document

## Overview

The `validate_workflow_content` tool extends the act-testing-mcp server to validate GitHub Actions workflow YAML content provided as a string. This design reuses existing validation infrastructure while adding temporary file management to enable validation of workflows that don't yet exist on disk.

The tool follows the established MCP server patterns in the codebase, maintaining consistency with the existing `validate_workflow` tool while adding the capability to handle string-based workflow content.

## Architecture

### High-Level Flow

```
User Request (YAML string)
    ↓
MCP Server (validate_workflow_content handler)
    ↓
Generate unique temporary filename
    ↓
Write YAML content to .github/workflows/temp-validate-{timestamp}.yml
    ↓
Call existing validation logic (act --list)
    ↓
Capture validation results
    ↓
Clean up temporary file (try-finally)
    ↓
Return formatted results to user
```

### Component Integration

The new tool integrates with existing components:

1. **MCP Server (index.js)**: Adds new tool definition and handler
2. **act-helpers.js**: Reuses `runActCommand()` for validation
3. **File System**: Uses Node.js `fs` module for temporary file management
4. **act CLI**: Leverages existing act integration for validation

## Components and Interfaces

### 1. Tool Definition

The tool will be added to the `tools` array in `index.js`:

```javascript
{
  name: "validate_workflow_content",
  description: "Validates GitHub Actions workflow YAML content directly from a string. Returns validation results including syntax errors and warnings.",
  inputSchema: {
    type: "object",
    properties: {
      yamlContent: {
        type: "string",
        description: "The complete YAML workflow content as a string"
      }
    },
    required: ["yamlContent"]
  }
}
```

### 2. Tool Handler

The handler will be added to the `CallToolRequestSchema` switch statement:

```javascript
case "validate_workflow_content": {
  const { yamlContent } = args;
  
  // Generate unique temporary filename
  const timestamp = Date.now();
  const tempFilename = `temp-validate-${timestamp}.yml`;
  const tempPath = join(PROJECT_ROOT, ".github/workflows", tempFilename);
  
  let result;
  try {
    // Write YAML content to temporary file
    writeFileSync(tempPath, yamlContent, "utf8");
    
    // Validate using act (reuse existing logic)
    result = runActCommand([
      "--list",
      "-W",
      `.github/workflows/${tempFilename}`,
    ]);
  } finally {
    // Clean up temporary file
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch (cleanupError) {
        // Log but don't fail on cleanup errors
        console.error(`Failed to clean up temp file: ${cleanupError.message}`);
      }
    }
  }
  
  // Return formatted results (same format as validate_workflow)
  return {
    content: [
      {
        type: "text",
        text: result.success
          ? `✅ Workflow content is valid!\n\n${result.output}`
          : `❌ Workflow content has issues:\n\n${result.error}`,
      },
    ],
  };
}
```

### 3. Helper Function (Optional Enhancement)

A shared validation helper could be extracted to reduce duplication between `validate_workflow` and `validate_workflow_content`:

```javascript
/**
 * Validate a workflow file using act
 * @param {string} workflowFilename - Relative path to workflow file in .github/workflows/
 * @returns {object} Validation result with success, output, and error
 */
function validateWorkflowFile(workflowFilename) {
  return runActCommand([
    "--list",
    "-W",
    `.github/workflows/${workflowFilename}`,
  ]);
}
```

This helper would be added to `utils/act-helpers.js` and used by both validation tools.

## Data Models

### Input Schema

```typescript
interface ValidateWorkflowContentInput {
  yamlContent: string; // Complete YAML workflow definition
}
```

### Output Schema

```typescript
interface ValidationResult {
  content: Array<{
    type: "text";
    text: string; // Formatted validation message with emoji indicators
  }>;
}
```

### Temporary File Naming Convention

- Pattern: `temp-validate-{timestamp}.yml`
- Example: `temp-validate-1698765432123.yml`
- Location: `.github/workflows/`
- Timestamp: `Date.now()` for uniqueness

## Error Handling

### Error Scenarios and Responses

1. **Missing .github/workflows directory**
   - Detection: Check `existsSync()` before writing
   - Response: Return error message indicating directory must exist
   - Example: `❌ Error: .github/workflows directory not found`

2. **Invalid YAML content**
   - Detection: act validation will fail
   - Response: Return act's error output
   - Example: `❌ Workflow content has issues:\n\nyaml: line 5: mapping values are not allowed in this context`

3. **File write failure**
   - Detection: `writeFileSync()` throws exception
   - Response: Catch and return error message
   - Example: `❌ Error writing temporary workflow file: EACCES: permission denied`

4. **Cleanup failure**
   - Detection: `unlinkSync()` throws exception in finally block
   - Response: Log error to console, don't fail the validation
   - Rationale: Validation result is more important than cleanup success

5. **act not available**
   - Detection: `runActCommand()` returns error
   - Response: Return act error message
   - Example: `❌ Workflow content has issues:\n\nact: command not found`

### Error Handling Pattern

```javascript
try {
  // Write temporary file
  writeFileSync(tempPath, yamlContent, "utf8");
  
  // Validate
  result = runActCommand([...]);
} catch (error) {
  // Handle write or validation errors
  return {
    content: [{
      type: "text",
      text: `❌ Error validating workflow content: ${error.message}`
    }]
  };
} finally {
  // Always attempt cleanup
  if (existsSync(tempPath)) {
    try {
      unlinkSync(tempPath);
    } catch (cleanupError) {
      console.error(`Failed to clean up temp file: ${cleanupError.message}`);
    }
  }
}
```

## Testing Strategy

### Unit Tests (test/index.test.js)

1. **Test: Valid workflow content validation**
   - Input: Valid YAML workflow string
   - Expected: Success response with validation output
   - Verification: Check response format and success indicator

2. **Test: Invalid workflow content validation**
   - Input: Invalid YAML workflow string (syntax error)
   - Expected: Error response with act error details
   - Verification: Check error message contains validation issues

3. **Test: Temporary file cleanup on success**
   - Input: Valid YAML workflow string
   - Expected: Temporary file is deleted after validation
   - Verification: Check file does not exist after tool execution

4. **Test: Temporary file cleanup on failure**
   - Input: Invalid YAML workflow string
   - Expected: Temporary file is deleted even when validation fails
   - Verification: Check file does not exist after tool execution

5. **Test: Unique filename generation**
   - Input: Multiple concurrent validation requests (simulated)
   - Expected: Each request uses a unique temporary filename
   - Verification: Check filenames contain different timestamps

6. **Test: Missing workflows directory**
   - Setup: Temporarily rename .github/workflows directory
   - Input: Valid YAML workflow string
   - Expected: Error message about missing directory
   - Cleanup: Restore directory

### Test Implementation Pattern

Following existing test patterns in the codebase:

```javascript
test("validate_workflow_content validates valid YAML", async (t) => {
  const validYaml = `
name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
  `;
  
  // Test would invoke the tool handler
  // Verify success response
  // Verify temporary file is cleaned up
});

test("validate_workflow_content handles invalid YAML", async (t) => {
  const invalidYaml = `
name: Test Workflow
on: [push
jobs:
  test:
    runs-on: ubuntu-latest
  `;
  
  // Test would invoke the tool handler
  // Verify error response
  // Verify temporary file is cleaned up
});
```

### Integration Testing

The existing test infrastructure already validates:
- act availability
- Docker availability
- MCP server syntax

These tests will continue to provide coverage for the underlying dependencies.

### Manual Testing Checklist

1. Test with AI assistant (Claude/Cursor)
   - Ask: "Validate this workflow YAML: [paste YAML]"
   - Verify: Correct validation response
   
2. Test with valid workflow content
   - Verify: Success message and output
   
3. Test with invalid workflow content
   - Verify: Error message with details
   
4. Test concurrent validations
   - Verify: No file conflicts
   
5. Test cleanup
   - Verify: No temp files remain in .github/workflows/

## Implementation Notes

### Code Reuse

The design maximizes code reuse:
- Uses existing `runActCommand()` from act-helpers.js
- Uses same validation command as `validate_workflow` tool
- Returns results in identical format to `validate_workflow` tool
- Follows existing error handling patterns

### Performance Considerations

- File I/O is minimal (single write, single delete)
- Validation time is dominated by act execution (same as existing tool)
- Temporary files are small (typical workflow files are < 10KB)
- Cleanup is guaranteed via try-finally

### Security Considerations

1. **File System Access**: Temporary files are written to `.github/workflows/` only
2. **Filename Safety**: Timestamp-based names avoid path traversal issues
3. **Content Validation**: act performs the actual validation, no code execution
4. **Cleanup**: Ensures temporary files don't accumulate

### Compatibility

- Node.js 20+: Uses ES modules (existing requirement)
- act: Uses same commands as existing tools
- Docker: Same requirements as existing tools
- File system: Standard Node.js fs module

## Documentation Updates

### README.md Additions

Add new section after `validate_workflow`:

```markdown
### `validate_workflow_content`

Validates workflow YAML content provided as a string.

**Parameters:**

- `yamlContent` (required): Complete YAML workflow content as a string

**Example:**

```bash
# Validate dynamically generated workflow
validate_workflow_content yamlContent='
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
'
```

**Use Cases:**

- Validating workflows before writing to disk
- Testing dynamically generated workflows
- Multi-agent systems that generate workflows programmatically
- CI/CD pipeline validation in development

**Note:** This tool creates a temporary file in `.github/workflows/` during validation and automatically cleans it up afterward.
```

### Usage Examples Section

Add example to "With AI Assistant (Claude)" section:

```markdown
- *"Validate this workflow YAML: [paste YAML content]"*
- *"Check if this generated workflow is valid before I save it"*
```

## Design Decisions and Rationales

### Decision 1: Temporary File Approach

**Decision**: Write YAML content to a temporary file rather than piping to act

**Rationale**: 
- act requires a file path for the `-W` flag
- act doesn't support stdin for workflow content
- Temporary file approach is simple and reliable
- Cleanup is straightforward with try-finally

**Alternatives Considered**:
- Piping to act stdin: Not supported by act's `-W` flag
- Using act's job ID: Requires workflow to already exist

### Decision 2: Timestamp-Based Filenames

**Decision**: Use `Date.now()` for unique temporary filenames

**Rationale**:
- Simple and reliable for uniqueness
- No external dependencies (no UUID library needed)
- Sufficient for typical usage patterns
- Easy to identify temporary files by name pattern

**Alternatives Considered**:
- Random UUIDs: Adds dependency, overkill for this use case
- Sequential numbers: Requires state management
- Process ID: Not unique across multiple processes

### Decision 3: Reuse Existing Validation Logic

**Decision**: Use the same act command as `validate_workflow`

**Rationale**:
- Ensures consistent validation behavior
- Reduces code duplication
- Leverages tested and proven approach
- Maintains compatibility with act updates

### Decision 4: Same Output Format

**Decision**: Return results in identical format to `validate_workflow`

**Rationale**:
- Consistent user experience
- AI assistants can handle both tools identically
- Reduces documentation complexity
- Simplifies testing

### Decision 5: Try-Finally for Cleanup

**Decision**: Use try-finally block to guarantee cleanup

**Rationale**:
- Ensures cleanup even on validation failure
- Prevents accumulation of temporary files
- Standard pattern for resource management
- Separates cleanup errors from validation errors

### Decision 6: No Helper Function Extraction (Initial Implementation)

**Decision**: Implement inline first, extract helper if needed later

**Rationale**:
- YAGNI principle: Don't add abstraction until needed
- Only two tools currently use validation
- Inline implementation is clear and maintainable
- Can refactor later if more validation tools are added

**Future Consideration**: If a third validation tool is added, extract shared logic to `validateWorkflowFile()` helper in act-helpers.js
