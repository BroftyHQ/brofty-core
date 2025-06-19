import { getCurrentCommitHash } from "../../libs/github.js";
import { BACKEND_URL } from "../../common/constants.js";
import logger from "../../common/logger.js";
import { exec } from "child_process";
import { promisify } from "util";
import restart_core_server from "../../restart_core_server.js";

const execAsync = promisify(exec);

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
      const data = (await response.json()) as { lastest_commit?: string };
      return data.lastest_commit || null;
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
    logger.info("Starting project update...");

    // Step 1: Git pull
    logger.info("Pulling latest code...");
    const gitResult = await execAsync("git pull");
    logger.info("Git pull output:", gitResult.stdout);
    if (gitResult.stderr) {
      logger.warn("Git pull warnings:", gitResult.stderr);
    }

    // Step 2: Yarn install
    logger.info("Installing dependencies...");
    const yarnInstallResult = await execAsync("yarn install");
    logger.info("Yarn install completed");
    if (yarnInstallResult.stderr) {
      logger.warn("Yarn install warnings:", yarnInstallResult.stderr);
    }

    // Step 3: Yarn compile
    logger.info("Compiling TypeScript...");
    const compileResult = await execAsync("yarn compile");
    logger.info("Compilation completed");
    if (compileResult.stderr) {
      logger.warn("Compilation warnings:", compileResult.stderr);
    }

    logger.info("Project update completed successfully!");

    // if update is successful, run restart_core_server
    await restart_core_server();
    return true;
  } catch (error) {
    logger.error("Failed to update project:", error);
    return false;
  }
}

export default async function check_update() {
  const CURRENT_HASH = getCurrentCommitHash();
  const REMOTE_HASH = await getRemoteCommitHash();

  if (!REMOTE_HASH) {
    logger.error("Could not fetch remote commit hash");
    return false;
  }
  if (CURRENT_HASH !== REMOTE_HASH) {
    logger.info("Update available!");
    logger.info(`Current: ${CURRENT_HASH}`);
    logger.info(`Remote: ${REMOTE_HASH}`);

    // Perform the update
    const updateSuccess = await updateProject();
    if (updateSuccess) {
      logger.info("Update process completed successfully");
      return true;
    } else {
      logger.error("Update process failed");
      return false;
    }
  }

  logger.info("Already up to date");
  return false;
}
