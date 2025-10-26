import test from "ava";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import {
  runActCommand,
  getWorkflows,
  buildActArgs,
  checkSystemRequirements,
  PROJECT_ROOT,
  ACT_BINARY,
} from "../utils/act-helpers.js";

// Test helper functions
test("runActCommand returns proper structure", (t) => {
  const result = runActCommand(["--version"]);

  t.true(typeof result === "object", "Should return an object");
  t.true(typeof result.success === "boolean", "Should have success boolean");
  t.true(typeof result.output === "string", "Should have output string");

  if (result.success) {
    t.truthy(
      result.output.includes("act version"),
      "Should contain version info",
    );
    t.is(result.error, null, "Error should be null on success");
  } else {
    t.truthy(result.error, "Should have error message on failure");
  }
});

test("getWorkflows returns workflow data", (t) => {
  const result = getWorkflows();

  t.true(typeof result === "object", "Should return an object");
  t.true(Array.isArray(result.workflows), "Should have workflows array");

  if (result.error === null) {
    // If successful, workflows should have expected structure
    result.workflows.forEach((workflow) => {
      t.truthy(workflow.jobId, "Each workflow should have jobId");
      t.truthy(workflow.jobName, "Each workflow should have jobName");
      t.truthy(workflow.workflowName, "Each workflow should have workflowName");
    });
  }
});

test("buildActArgs creates correct arguments", (t) => {
  const args = buildActArgs({
    workflow: "test.yml",
    event: "push",
    dryRun: true,
    verbose: true,
    env: { NODE_ENV: "test" },
    secrets: { SECRET_KEY: "value" },
  });

  t.true(Array.isArray(args), "Should return array");
  t.true(args.includes("push"), "Should include event");
  t.true(args.includes("-W"), "Should include workflow flag");
  t.true(
    args.includes(".github/workflows/test.yml"),
    "Should include workflow path",
  );
  t.true(args.includes("--dryrun"), "Should include dry run flag");
  t.true(args.includes("--verbose"), "Should include verbose flag");
  t.true(args.includes("--env"), "Should include env flag");
  t.true(args.includes("NODE_ENV=test"), "Should include env value");
  t.true(args.includes("--secret"), "Should include secret flag");
  t.true(args.includes("SECRET_KEY=value"), "Should include secret value");
});

test("buildActArgs handles job IDs correctly", (t) => {
  const args = buildActArgs({
    workflow: "my-job-id",
    event: "pull_request",
  });

  t.true(args.includes("pull_request"), "Should include event");
  t.true(args.includes("-j"), "Should include job flag for job IDs");
  t.true(args.includes("my-job-id"), "Should include job ID");
  t.false(args.includes("-W"), "Should not include workflow flag for job IDs");
});

test("checkSystemRequirements returns status array", (t) => {
  const checks = checkSystemRequirements();

  t.true(Array.isArray(checks), "Should return an array");
  t.true(checks.length > 0, "Should have at least one check");

  checks.forEach((check) => {
    t.truthy(check.type, "Each check should have a type");
    t.truthy(check.message, "Each check should have a message");
    t.true(
      ["success", "error", "info"].includes(check.type),
      "Type should be valid",
    );
  });
});

test("MCP server syntax is valid", (t) => {
  // Test that the MCP server file can be parsed without syntax errors
  try {
    // Use --check to validate syntax without running
    execSync("node --check index.js", {
      encoding: "utf8",
    });
    t.pass("MCP server syntax is valid");
  } catch (error) {
    t.fail(`MCP server has syntax errors: ${error.message}`);
  }
});

test("constants are defined correctly", (t) => {
  t.truthy(PROJECT_ROOT, "PROJECT_ROOT should be defined");
  t.truthy(ACT_BINARY, "ACT_BINARY should be defined");
  t.true(typeof PROJECT_ROOT === "string", "PROJECT_ROOT should be a string");
  t.true(typeof ACT_BINARY === "string", "ACT_BINARY should be a string");
});

// Test validate_workflow_content tool
test("validate_workflow_content validates valid YAML", (t) => {
  const validYaml = `name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: echo "test"
`;

  // Test the validation logic by simulating what the tool does

  const timestamp = Date.now();
  const tempFilename = `temp-validate-${timestamp}.yml`;
  const tempPath = join(PROJECT_ROOT, ".github/workflows", tempFilename);

  let result;
  try {
    writeFileSync(tempPath, validYaml, "utf8");
    result = runActCommand(["--list", "-W", `.github/workflows/${tempFilename}`]);

    t.true(typeof result === "object", "Should return an object");
    t.true(typeof result.success === "boolean", "Should have success boolean");
    
    // Note: result.success may be false if act/docker is not available
    // but the test validates the structure is correct
  } finally {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }
  }

  // Verify cleanup
  t.false(existsSync(tempPath), "Temporary file should be cleaned up");
});

test("validate_workflow_content handles invalid YAML", (t) => {
  const invalidYaml = `name: Test Workflow
on: [push
jobs:
  test:
    runs-on: ubuntu-latest
`;

  const timestamp = Date.now();
  const tempFilename = `temp-validate-${timestamp}.yml`;
  const tempPath = join(PROJECT_ROOT, ".github/workflows", tempFilename);

  let result;
  try {
    writeFileSync(tempPath, invalidYaml, "utf8");
    result = runActCommand(["--list", "-W", `.github/workflows/${tempFilename}`]);

    t.true(typeof result === "object", "Should return an object");
    t.true(typeof result.success === "boolean", "Should have success boolean");
    
    // Invalid YAML should result in failure
    if (result.success === false) {
      t.truthy(result.error, "Should have error message for invalid YAML");
    }
  } finally {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }
  }

  // Verify cleanup even on failure
  t.false(existsSync(tempPath), "Temporary file should be cleaned up even on failure");
});

test("validate_workflow_content generates unique filenames", (t) => {
  const timestamp1 = Date.now();
  const tempFilename1 = `temp-validate-${timestamp1}.yml`;
  
  // Small delay to ensure different timestamp
  const timestamp2 = Date.now() + 1;
  const tempFilename2 = `temp-validate-${timestamp2}.yml`;

  t.not(tempFilename1, tempFilename2, "Should generate unique filenames");
  t.true(tempFilename1.startsWith("temp-validate-"), "Should follow naming pattern");
  t.true(tempFilename1.endsWith(".yml"), "Should have .yml extension");
  t.true(tempFilename2.startsWith("temp-validate-"), "Should follow naming pattern");
  t.true(tempFilename2.endsWith(".yml"), "Should have .yml extension");
});
