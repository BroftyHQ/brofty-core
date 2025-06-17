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
      let type = "out";
      let message = "";
      try {
        const data = JSON.parse(packet.data);
        message = data.message || "";
        type = data.level || "out";
      } catch (error) {
        // If JSON parsing fails, we assume packet.data is a string
        message = packet.data;
      }

      pubsub.publish("SYSTEM_LOGS", {
        systemLogs: {
          type,
          message,
          timestamp: DateTime.now().toMillis().toString(),
        },
      });
    });

    bus.on("log:err", (packet) => {
      let type = "err";
      let message = "";
      try {
        const data = JSON.parse(packet.data);
        message = data.message || "";
        type = data.level || "err";
      } catch (error) {
        // If JSON parsing fails, we assume packet.data is a string
        message = packet.data;
      }

      pubsub.publish("SYSTEM_LOGS", {
        systemLogs: {
          type,
          message,
          timestamp: DateTime.now().toMillis().toString(),
        },
      });
    });
  });
}
