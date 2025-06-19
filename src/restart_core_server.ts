import { IS_PRODUCTION } from "./common/constants.js";
import logger from "./common/logger.js";
import pm2 from "pm2";
import path from "path";

const PROJECT_ROOT = path.resolve(process.cwd());

export default async function restart_core_server() {
  // code is already fetched and compiled
  // now we need to restart dev server or production server or pm2 process
  if (IS_PRODUCTION) {
    // pm2 based production server
    try {
      await restartPM2Process("brofty-core");
      console.log("Successfully restarted brofty-core via PM2");
    } catch (error) {
      console.error("Failed to restart brofty-core via PM2:", error);
      throw error;
    }

    return;
  } else {
    logger.warn("Please restart the dev server manually to apply changes.");
  }
}

/**
 * Restart a PM2 process by forcing it to start again.
 * @param processName - Name of the PM2 process to restart
 */
async function restartPM2Process(processName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        reject(new Error(`Failed to connect to PM2: ${err.message}`));
        return;
      } // Start the process from ecosystem.config.cjs with production environment

      const configPath = path.join(PROJECT_ROOT, "ecosystem.config.cjs");
      //@ts-ignore
      pm2.start(
        configPath,
        {
          env: "production",
          name: processName,
          force: true, // Force restart the process
        },
        (startErr) => {
          pm2.disconnect();

          if (startErr) {
            reject(
              new Error(`Failed to start ${processName}: ${startErr.message}`)
            );
            return;
          }

          resolve();
        }
      );
    });
  });
}
