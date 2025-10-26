# Implementation Plan

- [x] 1. Add tool definition to MCP server
  - Add `validate_workflow_content` tool definition to the `tools` array in `index.js`
  - Define input schema with `yamlContent` string parameter
  - Include descriptive text explaining the tool's purpose
  - _Requirements: 1.1, 4.2_

- [x] 2. Implement tool handler with temporary file management
  - [x] 2.1 Add case handler in CallToolRequestSchema switch statement
    - Extract `yamlContent` from args
    - Generate unique temporary filename using `Date.now()` timestamp
    - Construct full path to temporary file in `.github/workflows/` directory
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

  - [x] 2.2 Implement file write and validation logic
    - Import `writeFileSync` and `unlinkSync` from `fs` module
    - Write YAML content to temporary file using `writeFileSync`
    - Call `runActCommand()` with `--list` and `-W` flags pointing to temporary file
    - Wrap file operations in try-finally block for guaranteed cleanup
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 6.1, 6.2_

  - [x] 2.3 Implement error handling and cleanup
    - Add try-catch around file write operation
    - Add finally block to ensure temporary file deletion
    - Handle cleanup errors gracefully with console.error logging
    - Return formatted error messages for validation failures
    - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4_

  - [x] 2.4 Format and return validation results
    - Return results in same format as `validate_workflow` tool
    - Use success/error emoji indicators (✅/❌)
    - Include act output or error details in response
    - _Requirements: 1.4, 6.3_

- [x] 3. Add comprehensive unit tests
  - [x] 3.1 Create test for valid workflow content validation
    - Define valid YAML workflow string as test fixture
    - Invoke tool handler with valid content
    - Assert success response format
    - Verify temporary file is cleaned up after validation
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 3.2 Create test for invalid workflow content validation
    - Define invalid YAML workflow string with syntax error
    - Invoke tool handler with invalid content
    - Assert error response format and message content
    - Verify temporary file is cleaned up even on failure
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 3.3 Create test for unique filename generation
    - Simulate multiple validation requests
    - Verify each generates unique temporary filename
    - Check timestamp-based naming pattern
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 3.4 Create test for cleanup guarantee
    - Test cleanup occurs in success scenario
    - Test cleanup occurs in failure scenario
    - Verify no temporary files remain after execution
    - _Requirements: 2.1, 2.2, 5.4_

- [x] 4. Update documentation
  - [x] 4.1 Add tool documentation to README.md
    - Add new section after `validate_workflow` tool
    - Document tool name, description, and parameters
    - Include usage examples with YAML content
    - Explain use cases for the tool
    - Note temporary file creation and cleanup behavior
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.2 Add AI assistant usage examples
    - Add example prompts to "With AI Assistant" section
    - Show how to validate generated workflows
    - Demonstrate string-based validation scenarios
    - _Requirements: 4.1, 4.2_

- [x] 5. Verify integration and compatibility
  - [x] 5.1 Test with existing MCP server infrastructure
    - Verify tool appears in tool list
    - Test tool invocation through MCP protocol
    - Confirm compatibility with existing tools
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.2 Validate error handling patterns
    - Test missing .github/workflows directory scenario
    - Test file write permission errors
    - Verify error messages follow existing patterns
    - _Requirements: 2.3, 2.4_
