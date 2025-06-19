import { getCurrentCommitHash } from "../../libs/github.js";
import { BACKEND_URL } from "../../common/constants.js";
import logger from "../../common/logger.js";
import restart_core_server from "../../restart_core_server.js";
import { execa } from "execa";
import path from "path";

// Example: Get the project root directory
const PROJECT_ROOT = path.resolve(process.cwd());

async function getRemoteCommitHash(): Promise<string | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/rest/v1/core-server-latest-version`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = (await response.json()) as {
        latest_commit?: string;
        cached?: boolean;
      };
      return data.latest_commit || null;
    }

    logger.error(
      "Failed to fetch remote commit hash:",
      response.status,
      response.statusText
    );
    return null;
  } catch (error) {
    logger.error("Failed to fetch remote commit hash:", error);
    return null;
  }
}

async function updateProject(): Promise<boolean> {
  try {
    logger.info("Starting project update...", PROJECT_ROOT);

    // Method 1: Using cwd option with template literals
    logger.info("Pulling latest code...");
    const gitResult = await execa({ cwd: PROJECT_ROOT })`git pull`;
    logger.info("Git pull output:", gitResult.stdout);
    if (gitResult.stderr) {
      logger.warn("Git pull warnings:", gitResult.stderr);
    }    // Method 2: Using traditional syntax with options
    logger.info("Installing dependencies...");
    const yarnInstallResult = await execa('yarn', ['install'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit' // This will show real-time output
    });
    logger.info("Yarn install completed");
    if (yarnInstallResult.stderr) {
      logger.warn("Yarn install warnings:", yarnInstallResult.stderr);
    }

    return true;
  } catch (error) {
    logger.error("Failed to update project:", error);
    return false;
  }
}

async function compileProject(): Promise<boolean> {
  try {
    logger.info("Starting compilation in separate terminal session...");
    
    // Start compilation in a detached process (independent terminal session)
    const compileProcess = execa('yarn', ['compile'], {
      cwd: PROJECT_ROOT,
      detached: true,   // Run independently from parent process
      stdio: 'ignore',   // Don't inherit stdio (runs in background)
      windowsHide: true  // On Windows, hide the terminal window
    });

    // Detach the process so it runs independently
    compileProcess.unref();

    logger.info("Compilation started in separate terminal session");
    logger.info(`Compilation process PID: ${compileProcess.pid}`);
    
    return true;
  } catch (error) {
    logger.error("Failed to start compilation process:", error);
    return false;
  }
}

export default async function check_update() {
  logger.info("Checking for core server updates...");
  const CURRENT_HASH = await getCurrentCommitHash();
  const REMOTE_HASH = await getRemoteCommitHash();
  logger.info(`Current commit hash: ${CURRENT_HASH}`);
  logger.info(`Remote commit hash: ${REMOTE_HASH}`);

  if (!REMOTE_HASH) {
    logger.error("Could not fetch remote commit hash");
    return false;
  }  if (CURRENT_HASH !== REMOTE_HASH) {
    logger.info("Update available!");
    logger.info(`Current: ${CURRENT_HASH}`);
    logger.info(`Remote: ${REMOTE_HASH}`);

    // Step 1: Perform the update (git pull + yarn install)
    const updateSuccess = await updateProject();
    if (!updateSuccess) {
      logger.error("Update process failed");
      return false;
    }

    // Step 2: Compile the project separately
    const compileSuccess = await compileProject();
    if (!compileSuccess) {
      logger.error("Compilation failed");
      return false;
    }

    // Step 3: Restart the server only if both update and compile succeeded
    try {
      await restart_core_server();
      logger.info("Update process completed successfully");
      return true;
    } catch (error) {
      logger.error("Failed to restart server:", error);
      return false;
    }
  }
  return false;
}
