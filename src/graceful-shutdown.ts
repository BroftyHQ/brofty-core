import logger from "./common/logger.js";
import { stop_core_server } from "./stop-core-server.js";
import { cleanup_all_system_status_streams } from "./functions/system/start_streaming_system_status.js";

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
    // Clean up all system status streams first
    cleanup_all_system_status_streams();
    
    await stop_core_server();
    logger.info('############ Server stopped successfully ############');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}
