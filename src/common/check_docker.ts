import { execSync } from 'child_process';
import logger from "./logger.js";

export default async function check_docker() {
  try {
    // Check if Docker is installed and running
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    logger.error('Docker is not installed or not running:', error);
    process.exit(1); // Exit the process if Docker is not running
  }
}