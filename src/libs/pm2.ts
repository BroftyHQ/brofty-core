import pm2 from "pm2";
import { IS_PRODUCTION } from "../common/constants.js";
import logger from "../common/logger.js";
import pubsub from "../pubsub/index.js";
import { DateTime } from "luxon";

export default async function start_pm2_manager() {
  if (!IS_PRODUCTION) {
    logger.info(`Log streaming is disabled in non-production mode.`);
    return;
  }
  // only connect to pm2 global god instance not launch daemon
  pm2.connect(true, (err) => {
    if (err) {
      console.error("PM2 connect error:", err);
      process.exit(1);
    }
  });

  pm2.launchBus((err, bus) => {
    if (err) {
      console.error("PM2 bus error:", err);
      return;
    }

    bus.on("log:out", (packet) => {
      const log_object =
        typeof packet.data === "string"
          ? {
              type: "out",
              message: packet.data,
            }
          : {
              type: packet.level || "out",
              message: packet.data.message || "",
            };
      pubsub.publish("SYSTEM_LOGS", {
        systemLogs: {
          ...log_object,
          timestamp: DateTime.now().toMillis().toString(),
        },
      });
    });

    bus.on("log:err", (packet) => {
      const log_object =
        typeof packet.data === "string"
          ? {
              type: "err",
              message: packet.data,
            }
          : {
              type: packet.level || "err",
              message: packet.data.message || "",
            };
      pubsub.publish("SYSTEM_LOGS", {
        systemLogs: {
          ...log_object,
          timestamp: DateTime.now().toMillis().toString(),
        },
      });
    });
  });
}
