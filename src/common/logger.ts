import { DateTime } from "luxon";
import winston from "winston";
import Transport from "winston-transport";
import pubsub from "../pubsub/index.js";

// In-memory cache for last 25 logs
const logCache: Array<{ type: string; message: string; timestamp: string }> =
  [];

export function getLastLogs() {
  return [...logCache];
}

class CustomTransport extends Transport {
  constructor(opts) {
    super(opts);
  }
  log(info, callback) {
    const { level, message } = info;
    const logEntry = {
      type: level,
      message,
      timestamp: DateTime.now().toMillis().toString(),
    };
    // Add to cache and maintain max 25 logs
    logCache.push(logEntry);
    if (logCache.length > 25) logCache.shift();
    pubsub.publish("SYSTEM_LOGS", { systemLogs: logEntry });
    callback();
  }
}

// Using transport
const log_stream_transport = new CustomTransport({});

const logger = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console(), log_stream_transport],
});

export default logger;
