import logger from "../../common/logger.js";
import { execa } from "execa";
import path from "path";

const containerName = "brofty-memory-server";

export async function start_memory_server() {
  try {
    const cwd = process.cwd();
    const storagePath = path.join(cwd, "qdrant_storage");

    // Check if the container is already running
    const checkResult = await execa("docker", [
      "ps",
      "--filter",
      `name=${containerName}`,
      "--filter",
      "status=running",
      "-q"
    ]);

    if (checkResult.stdout && checkResult.stdout.trim().length > 0) {
      logger.info(
        `Memory server '${containerName}' is already running. Skipping start.`
      );
      return;
    }

    // If not running, remove any stopped container with the same name
    try {
      await execa("docker", ["rm", "-f", containerName]);
    } catch (removeErr: any) {
      if (!removeErr.message.includes("No such container")) {
        logger.error(
          `Error removing existing Memory server: ${removeErr.message}`
        );
        return;
      }
    }

    // Start the container
    const startResult = await execa("docker", [
      "run",
      "-d",
      "--name",
      containerName,
      "-p",
      "6333:6333",
      "-p",
      "6334:6334",
      "-v",
      `${storagePath}:/qdrant/storage`,
      "qdrant/qdrant"
    ]);

    if (startResult.stderr && startResult.stderr.toLowerCase().includes("docker daemon")) {
      logger.error(
        "Docker daemon does not appear to be running. Please start Docker Desktop."
      );
      return;
    }

    if (startResult.stderr) {
      logger.error(`Qdrant stderr: ${startResult.stderr}`);
    }

    if (startResult.stdout && startResult.stdout.trim().length > 0) {
      logger.info(`Memory server started: ${startResult.stdout}`);
    } else {
      logger.error(
        "Docker command executed but no container was started. Please check Docker status."
      );
    }

  } catch (error: any) {
    if (error.code === "ENOENT") {
      logger.error(
        "Docker is not installed or not found in PATH. Please install Docker Desktop and ensure it is running."
      );
    } else {
      logger.error(`Error starting Memory server: ${error.message}`);
    }
  }
}

export async function stop_memory_server(): Promise<void> {
  try {
    // First, check if the container exists and is running
    const checkResult = await execa("docker", [
      "ps",
      "--filter",
      `name=${containerName}`,
      "--filter",
      "status=running",
      "-q"
    ]);

    if (!checkResult.stdout || checkResult.stdout.trim().length === 0) {
      logger.info(
        `Memory server '${containerName}' is not running. Nothing to stop.`
      );
      return;
    }

    // Stop and remove the container
    try {
      await execa("docker", ["stop", containerName]);
      await execa("docker", ["rm", containerName]);
      // logger.info(
      //   `Memory server '${containerName}' stopped and removed successfully.`
      // );
    } catch (err: any) {
      // Check if the error is because container doesn't exist
      if (err.message.includes("No such container")) {
        logger.info(
          `Memory server '${containerName}' does not exist. Already cleaned up.`
        );
        return;
      }
      logger.error(
        `Error stopping/removing Memory server: ${err.message}`
      );
      throw err;
    }

  } catch (error: any) {
    logger.error(
      `Error checking Memory server status: ${error.message}`
    );
    throw error;
  }
}
