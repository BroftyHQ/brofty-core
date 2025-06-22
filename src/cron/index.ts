import { IS_PRODUCTION } from "../common/constants.js";
import logger from "../common/logger.js";
import cron from "cron";
import check_update from "./function/check_update.js";

export default async function start_cron(): Promise<cron.CronJob[]> {
  if (!IS_PRODUCTION) {
    logger.info("Cron jobs are disabled in non-production environments.");
    return [];
  }
  logger.info("Starting cron services");
  // Schedule a job to check for updates every 5 minutes
  const update_jobs = new cron.CronJob(
    "*/5 * * * *",
    () => {
      // add await here to ensure the job runs and exits gracefully
      // not applicable for update check as it is a fire-and-forget operation
      check_update();
    },
    () => {
      logger.info("Update check job stopped.");
    },
    true, // start immediately
    "UTC", // timezone
    null, // context
    false, // runOnInit
    null, // utcOffset
    false, // unrefTimeout
    true // waitForCompletion - ensures isCallbackRunning tracks async operations properly
  );

  return [update_jobs];
}
