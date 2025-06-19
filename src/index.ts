import start_core_server, { stop_core_server } from "./core_server.js";

// Start the server
start_core_server();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await stop_core_server();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await stop_core_server();
  process.exit(0);
});
