import { IS_PRODUCTION } from "../common/constants.js";
import logger from "../common/logger.js";
import cron from "cron";
import check_update from "./function/check_update.js";

export default async function start_cron() {
  if (!IS_PRODUCTION) {
    logger.info("Cron jobs are disabled in non-production environments.");
    return [];
  }

  // Schedule a job to check for updates every 5 minutes
  const update_jobs = new cron.CronJob("*/2 * * * *", async () => {
    await check_update();
  });

  update_jobs.start();
  logger.info("Starting cron jobs...");
  
  return [update_jobs];
}
