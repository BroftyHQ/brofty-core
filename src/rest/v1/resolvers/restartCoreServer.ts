import { Request, Response } from "express";
import { IS_PRODUCTION } from "../../../common/constants.js";
import logger from "../../../common/logger.js";
import restart_core_server from "../../../restart_core_server.js";

/**
 * GET /rest/v1/status
 * Returns the status of the Brofty core server
 */
export const restartCoreServer = async (req: Request, res: Response) => {
  logger.info(
    `Restarting Brofty core server in ${
      IS_PRODUCTION ? "production" : "development"
    } mode`
  );
  await restart_core_server();

  res.status(200).json({
    status: "ok",
    message: "Restarting the Brofty server...",
  });
};
