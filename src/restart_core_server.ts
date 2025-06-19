import { IS_PRODUCTION } from "./common/constants.js";
import start_core_server, { stop_core_server } from "./core_server.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Check if PM2 daemon is running and if brofty-core service is running
 * @returns Promise<boolean> - true if PM2 is running and brofty-core service exists
 */
async function checkIsPM2(): Promise<boolean> {
  try {
    // First check if PM2 daemon is running
    const { stdout: pingOutput } = await execAsync("pm2 ping");
    if (!pingOutput.includes("pong")) {
      return false;
    }

    // Check if brofty-core service is running in PM2
    const { stdout: listOutput } = await execAsync("pm2 list");

    // Parse PM2 list output to check if brofty-core service exists
    if (listOutput.includes("brofty-core")) {
      return true;
    }

    return false;
  } catch (error) {
    // PM2 command failed, likely PM2 is not installed or daemon is not running
    return false;
  }
}

export default async function restart_core_server() {
  // code is already fetched and compiled
  // now we need to restart dev server or production server or pm2 process

  if (IS_PRODUCTION) {
    const IS_PM2 = await checkIsPM2();

    if (IS_PM2) {
      // pm2 based production server
      try {
        await execAsync("pm2 restart brofty-core");
        console.log("Successfully restarted brofty-core via PM2");
      } catch (error) {
        console.error("Failed to restart brofty-core via PM2:", error);
        throw error;
      }
    } else {
      // handle local production server
      // started using yarn start
      await execAsync("yarn start");
      // exit current process
      process.exit(0);
    }

    return;  } else {
    // handle local development
    await stop_core_server(false); // Don't close DB connection during restart
    await start_core_server();
  }
}
