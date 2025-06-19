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
    // Method 1: Using cwd option with template literals
    logger.info("Pulling latest code...");
    const gitResult = await execa({ cwd: PROJECT_ROOT })`git pull`;
    // logger.info("Git pull output:", gitResult.stdout);
    if (gitResult.stderr) {
      logger.warn("Git pull warnings:", gitResult.stderr);
    } 
    // Method 2: Using traditional syntax with options
    // logger.info("Installing dependencies...");
    const yarnInstallResult = await execa(
      "yarn",
      ["install", "--production=false"],
      {
        cwd: PROJECT_ROOT,
        stdio: "pipe", // Capture output for logging
      }
    );
    // logger.info("Yarn install completed");
    // if (yarnInstallResult.stdout) {
    //   logger.info("Yarn install output:", yarnInstallResult.stdout);
    // }
    // if (yarnInstallResult.stderr) {
    //   logger.warn("Yarn install warnings:", yarnInstallResult.stderr);
    // }

    return true;
  } catch (error) {
    logger.error("Failed to update project:", error);
    return false;
  }
}

async function compileProject(): Promise<boolean> {
  try {
    // First, ensure TypeScript and type definitions are available
    try {
      await execa("yarn", ["tsc", "--version"], {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });
    } catch (tscError) {
      logger.warn(
        "TypeScript check failed, attempting to install:",
        tscError.message
      );
      // Try to install TypeScript locally if it's missing
      await execa("yarn", ["add", "-D", "typescript", "@types/node"], {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });
    }

    // Run compilation and wait for it to complete
    await execa("yarn", ["compile"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe", // Capture output for logging
      timeout: 300000, // 5 minute timeout
    });
    return true;
  } catch (error) {
    logger.error("Failed to compile project:", error);
    if (error.stdout) {
      logger.error("Compile stdout:", error.stdout);
    }
    if (error.stderr) {
      logger.error("Compile stderr:", error.stderr);
    }
    return false;
  }
}

export default async function check_update() {
  // logger.info("Checking for brofty core server updates");
  const CURRENT_HASH = await getCurrentCommitHash();
  const REMOTE_HASH = await getRemoteCommitHash();
  // logger.info(`Current commit hash: ${CURRENT_HASH}`);
  // logger.info(`Remote commit hash: ${REMOTE_HASH}`);

  if (!REMOTE_HASH) {
    logger.error("Could not fetch remote commit hash");
    return false;
  }
  if (CURRENT_HASH !== REMOTE_HASH) {
    logger.info("Update available!");

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
