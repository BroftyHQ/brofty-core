import { Request, Response } from "express";
import { IS_PRODUCTION } from "../../../common/constants.js";

/**
 * GET /rest/v1/status
 * Returns the status of the Brofty core server
 */
export const getStatus = (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: `Brofty core server is running in ${
      IS_PRODUCTION ? "production" : "development"
    } mode`,
  });
};
