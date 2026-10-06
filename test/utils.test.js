import test from "ava";
import { execSync } from "child_process";
import { existsSync, readFileSync, mkdtempSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join, isAbsolute, dirname } from "path";
import {
  isActAvailable,
  validateWorkflowContent,
} from "../utils/act-helpers.js";

test("validateWorkflowContent passes temp path to act and cleans up", (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), "act-test-root-"));
  let seen;
  const actRunner = (args, options) => {
    const path = args[args.indexOf("-W") + 1];
    seen = { args, options, path, content: readFileSync(path, "utf8") };
    return { success: true, output: "", error: null };
  };

  const result = validateWorkflowContent("name: x\n", {
    projectRoot,
    actRunner,
  });

  t.true(result.success);
  t.is(seen.args[0], "--list");
  t.true(isAbsolute(seen.path));
  t.is(seen.content, "name: x\n");
  t.is(seen.options.cwd, projectRoot);
  t.false(existsSync(dirname(seen.path)));
  t.deepEqual(readdirSync(projectRoot), []);
});

test("validateWorkflowContent cleans up when runner throws", (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), "act-test-root-"));
  let path;
  const actRunner = (args) => {
    path = args[args.indexOf("-W") + 1];
    throw new Error("boom");
  };

  t.throws(() => validateWorkflowContent("a: b", { projectRoot, actRunner }), {
    message: "boom",
  });
  t.false(existsSync(dirname(path)));
});

test("validateWorkflowContent rejects non-string content", (t) => {
  t.throws(() => validateWorkflowContent(42), { instanceOf: TypeError });
});

// Basic smoke tests to get started
test("act is available in system", (t) => {
  if (!isActAvailable()) {
    t.log("act not available in CI environment - skipping test");
    t.pass("Skipped: act not available");
    return;
  }

  t.pass("act is available");
});

test("docker is available in system", (t) => {
  try {
    const result = execSync("docker --version", { encoding: "utf8" });
    t.truthy(result.includes("Docker version"), "Docker should be available");
  } catch (error) {
    t.log("Docker not available - skipping test");
    t.pass("Skipped: Docker not available");
  }
});

test("project has workflows directory", (t) => {
  try {
    // Go up two levels from tools/act-testing-mcp to project root
    const projectRoot = process.env.PROJECT_ROOT || "../../";
    const result = execSync("ls -la .github/workflows/", {
      encoding: "utf8",
      cwd: projectRoot,
    });
    t.truthy(result.includes(".yml"), "Should have workflow files");
  } catch (error) {
    t.log(".github/workflows directory not found - skipping test");
    t.pass("Skipped: workflows directory not available");
  }
});
