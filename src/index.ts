import logger from "./common/logger.js";
import start_core_server from "./core_server.js";
import { gracefulShutdown } from "./graceful-shutdown.js";

// Start the server
start_core_server();

// PM2 process message listener for graceful shutdown
process.on('message', (msg) => {
  if (msg === 'shutdown' || (typeof msg === 'object' && msg && 'type' in msg && (msg as any).type === 'shutdown')) {
    gracefulShutdown('PM2_MESSAGE');
  }
});

// Handle graceful shutdown signals (backup for non-PM2 environments)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
