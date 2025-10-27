import { execSync, spawnSync } from "child_process";
import { existsSync, writeFileSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get project root dynamically
function findProjectRoot() {
  if (process.env.PROJECT_ROOT && process.env.PROJECT_ROOT.trim()) {
    return process.env.PROJECT_ROOT;
  }

  // Get the directory of this file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Navigate up from utils/ to project root (standalone repository)
  return join(__dirname, "../");
}

export const PROJECT_ROOT = findProjectRoot();
export const ACT_BINARY = process.env.ACT_BINARY || "/usr/local/bin/act";
export const LOG_FILE = join(PROJECT_ROOT, ".act-mcp.log");

function getActExecutable() {
  return existsSync(ACT_BINARY) ? ACT_BINARY : "act";
}

/**
 * Log a message to the log file
 * @param {string} message - Message to log
 */
function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, { flag: "a" });
  } catch (e) {
    // Ignore logging errors
  }
}

/**
 * Helper function to run act commands while redirecting output to stderr
 * @param {string[]} args - Command arguments
 * @param {object} options - Execution options
 * @returns {object} Result with success, output, and error
 */
export function runActCommand(args, options = {}) {
  const actExecutable = getActExecutable();
  const command = `${actExecutable} ${args.join(" ")}`;
  logToFile(`Running: ${command}`);

  const { cwd: providedCwd, ...spawnOptions } = options;
  const cwd =
    providedCwd ??
    (PROJECT_ROOT && existsSync(PROJECT_ROOT) ? PROJECT_ROOT : process.cwd());

  const result = spawnSync(actExecutable, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
    ...spawnOptions,
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";

  if (stdout) {
    process.stderr.write(stdout);
    logToFile(stdout.trim());
  }

  if (stderr) {
    process.stderr.write(stderr);
    logToFile(stderr.trim());
  }

  if (result.error) {
    const message = result.error.message || "Unknown error";
    logToFile(`Error: ${message}`);
    return {
      success: false,
      output: stdout,
      error: stderr || message,
    };
  }

  if (result.status === 0) {
    logToFile("Success with exit code 0");
    return { success: true, output: stdout, error: null };
  }

  const errorMessage =
    stderr || `Process exited with code ${result.status ?? "unknown"}`;
  logToFile(`Error: ${errorMessage}`);
  return {
    success: false,
    output: stdout,
    error: errorMessage,
  };
}

/**
 * Helper function to get workflows
 * @returns {object} Object with workflows array and error
 */
export function getWorkflows(projectRoot = PROJECT_ROOT) {
  try {
    const result = runActCommand(["--list"], { cwd: projectRoot });
    if (!result.success) {
      return { workflows: [], error: result.error };
    }

    // Parse act --list output
    const lines = result.output.split("\n").filter((line) => line.trim());
    const workflows = [];

    for (const line of lines) {
      if (line.includes(".yml")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          workflows.push({
            stage: parts[0],
            jobId: parts[1],
            jobName: parts[2],
            workflowName: parts[3],
            workflowFile: parts[4],
            events: parts.slice(5),
          });
        }
      }
    }

    return { workflows, error: null };
  } catch (error) {
    return { workflows: [], error: error.message };
  }
}

/**
 * Build act arguments for workflow execution
 * @param {object} params - Parameters for workflow execution
 * @returns {string[]} Array of act command arguments
 */
export function buildActArgs({
  workflow,
  event = "push",
  dryRun = false,
  verbose = false,
  env,
  secrets,
  eventData,
}) {
  let actArgs = [];

  // Add event type
  actArgs.push(event);

  // Add workflow specification
  if (workflow.endsWith(".yml") || workflow.endsWith(".yaml")) {
    actArgs.push("-W", `.github/workflows/${workflow}`);
  } else {
    actArgs.push("-j", workflow);
  }

  // Add flags
  if (dryRun) actArgs.push("--dryrun");
  if (verbose) actArgs.push("--verbose");

  // Handle environment variables
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      actArgs.push("--env", `${key}=${value}`);
    }
  }

  // Handle secrets
  if (secrets) {
    for (const [key, value] of Object.entries(secrets)) {
      actArgs.push("--secret", `${key}=${value}`);
    }
  }

  return actArgs;
}

/**
 * Create temporary event file for act
 * @param {object} eventData - Event data to write
 * @returns {string} Path to the created event file
 */
export function createEventFile(eventData, projectRoot = PROJECT_ROOT) {
  const eventFile = join(projectRoot, ".act-event.json");
  writeFileSync(eventFile, JSON.stringify(eventData, null, 2));
  return eventFile;
}

/**
 * Check if act is available in the system
 * @returns {boolean} True if act is available
 */
export function isActAvailable() {
  try {
    const shell = process.platform === "win32" ? "cmd.exe" : true; // Use bash which is available in the container
    const output = execSync("which act", { encoding: "utf8", shell });
    process.stderr.write(output);
    return true;
  } catch (error) {
    process.stderr.write(error.message);
    return false;
  }
}

/**
 * Check if act and docker are available
 * @returns {object} Status of system requirements
 */
export function checkSystemRequirements(projectRoot = PROJECT_ROOT) {
  const checks = [];
  const shell = process.platform === "win32" ? "cmd.exe" : true;

  // Check if act is installed
  try {
    const actExecutable = getActExecutable();
    const actVersion = execSync(`${actExecutable} --version`, {
      encoding: "utf8",
      shell,
    });
    // Redirect to stderr
    process.stderr.write(actVersion);
    checks.push({
      type: "success",
      message: `Act installed: ${actVersion.trim()}`,
    });
  } catch (error) {
    if (error.stderr) process.stderr.write(error.stderr);
    else if (error.message) process.stderr.write(error.message);
    checks.push({
      type: "error",
      message: `Act not found or not working: ${error.message}`,
    });
  }

  // Check if Docker is running
  try {
    const dockerVersion = execSync("docker --version", {
      encoding: "utf8",
      shell,
    });
    process.stderr.write(dockerVersion);
    checks.push({ type: "success", message: "Docker is installed" });

    try {
      const dockerPs = execSync("docker ps", { encoding: "utf8", shell });
      process.stderr.write(dockerPs);
      checks.push({ type: "success", message: "Docker is running" });
    } catch (error) {
      if (error.stderr) process.stderr.write(error.stderr);
      checks.push({
        type: "error",
        message: "Docker is installed but not running",
      });
    }
  } catch (error) {
    if (error.stderr) process.stderr.write(error.stderr);
    checks.push({ type: "error", message: "Docker not found" });
  }

  // Check project structure
  const workflowsDir = join(projectRoot, ".github/workflows");
  if (existsSync(workflowsDir)) {
    checks.push({
      type: "success",
      message: "GitHub Actions workflows directory found",
    });
  } else {
    checks.push({
      type: "error",
      message: "No .github/workflows directory found",
    });
  }

  // Check .actrc configuration
  const actrcPath = join(projectRoot, ".actrc");
  if (existsSync(actrcPath)) {
    checks.push({
      type: "success",
      message: ".actrc configuration file found",
    });
  } else {
    checks.push({
      type: "info",
      message: "No .actrc configuration file (optional)",
    });
  }

  return checks;
}

/**
 * Resolve project root from override or environment
 * @param {string} [override] - Explicit project root override
 * @returns {string} Resolved project root path
 */
export function resolveProjectRoot(override) {
  if (override && typeof override === "string" && override.trim()) {
    return override;
  }

  if (process.env.PROJECT_ROOT && process.env.PROJECT_ROOT.trim()) {
    return process.env.PROJECT_ROOT;
  }

  return PROJECT_ROOT;
}
