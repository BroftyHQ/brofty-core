import logger from "./common/logger.js";
import sequelize from "./db/sqlite/client.js";
import { stop_memory_server } from "./db/qdrant/start_memory_server.js";

// This will be set by core_server.ts when the server starts
let apolloServer: any = null;
let cronJobs: any[] = [];
let httpServer: any = null;
let serverCleanup: any = null;

// Function to set server instances from core_server
export function setServerInstances(instances: {
  apolloServer: any;
  cronJobs: any[];
  httpServer: any;
  serverCleanup: any;
}) {
  apolloServer = instances.apolloServer;
  cronJobs = instances.cronJobs;
  httpServer = instances.httpServer;
  serverCleanup = instances.serverCleanup;
}

export async function stop_core_server() {
  logger.info("🚫 Shutting down Brofty Core Server...");

  try {
    // Stop cron jobs first
    if (cronJobs && cronJobs.length > 0) {
      logger.info("Stopping cron jobs...");
      cronJobs.forEach((job) => {
        if (job && typeof job.stop === "function") {
          job.stop();
        }
      });
      cronJobs.length = 0; // Clear the array
    }

    // Stop Apollo Server
    if (apolloServer) {
      logger.info("Stopping Apollo Server...");
      await apolloServer.stop();
      apolloServer = null;
    } // Stop the WebSocket server
    if (serverCleanup) {
      logger.info("Stopping WebSocket server...");
      try {
        await serverCleanup.dispose();
        logger.info("WebSocket server stopped successfully");
      } catch (error: any) {
        // Handle the case where the WebSocket server is not running
        if (
          error.message &&
          error.message.includes("The server is not running")
        ) {
          logger.info("WebSocket server was already stopped");
        } else {
          logger.error("Error stopping WebSocket server:", error);
          throw error;
        }
      }
    }

    // Close the HTTP server
    if (httpServer) {
      logger.info("Stopping HTTP server...");
      if (httpServer.listening) {
        await new Promise<void>((resolve, reject) => {
          httpServer.close((err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } else {
        logger.info("HTTP server is not running.");
      }
    }

    // Stop memory server (Qdrant Docker container)
    logger.info("Stopping memory server...");
    await stop_memory_server();

    logger.info("Closing database connections...");
    try {
      // Check if Sequelize is connected before closing
      await sequelize.authenticate();
      logger.info("Sequelize connection verified, closing...");
      await sequelize.close();
      logger.info("Database connection closed successfully");
    } catch (error) {
      logger.info(
        "Sequelize is not connected or already closed:",
        (error as Error).message
      );
    }

    logger.info("Brofty Core Server stopped successfully");
  } catch (error) {
    logger.error("Error during server shutdown:", error);
    throw error;
  }
}
