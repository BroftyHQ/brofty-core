import logger from "./common/logger.js";
import { stop_core_server } from "./stop-core-server.js";

// Flag to prevent multiple shutdown attempts
let isShuttingDown = false;

// Graceful shutdown handler
export async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    await stop_core_server();
    logger.info('############ Server stopped successfully ############');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}
