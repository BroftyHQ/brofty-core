import logger from "./common/logger.js";
import start_core_server, { stop_core_server } from "./core_server.js";

// Start the server
start_core_server();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await stop_core_server();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await stop_core_server();
  process.exit(0);
});
