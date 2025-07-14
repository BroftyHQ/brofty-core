import logger from "./common/logger.js";
import getPrisma from "./db/prisma/client.js";
import { stop_memory_server } from "./db/qdrant/start_memory_server.js";
import { CronJob } from "cron";

// This will be set by core_server.ts when the server starts
let apolloServer: any = null;
let cronJobs: CronJob[] = [];
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
      const totalJobs = cronJobs.length;
      logger.info(`📅 Stopping ${totalJobs} cron job(s)...`);
      
      // First, stop all jobs that are not running callbacks
      const runningJobs: CronJob[] = [];
      let stoppedCount = 0;
      
      for (const job of cronJobs) {
        if (job && typeof job.stop === "function") {
          if (!job.isCallbackRunning) {
            // Stop jobs that are not running callbacks immediately
            job.stop();
            stoppedCount++;
          } else {
            // Keep track of jobs with running callbacks
            runningJobs.push(job);
          }
        }
      }

      if (stoppedCount > 0) {
        logger.info(`✅ Stopped ${stoppedCount} idle cron job(s)`);
      }

      // Now wait for running jobs to complete
      if (runningJobs.length > 0) {
        const timeout = 60000; // 1 minute timeout
        const startTime = Date.now();
        
        logger.info(`⏳ Waiting for ${runningJobs.length} running cron job(s) to complete...`);

        while (runningJobs.length > 0 && Date.now() - startTime < timeout) {
          const initialCount = runningJobs.length;
          
          // Check each running job
          for (let i = runningJobs.length - 1; i >= 0; i--) {
            const job = runningJobs[i];
            
            if (!job.isCallbackRunning) {
              // Job completed, stop it and remove from waiting list
              job.stop();
              runningJobs.splice(i, 1);
            }
          }

          // Log progress if jobs completed
          const completedCount = initialCount - runningJobs.length;
          if (completedCount > 0) {
            logger.info(`✅ ${completedCount} more cron job(s) completed, ${runningJobs.length} remaining`);
          }

          // If there are still running jobs, wait before checking again
          if (runningJobs.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
          }
        }

        // Force stop any remaining jobs that didn't complete within timeout
        if (runningJobs.length > 0) {
          logger.warn(`⚠️ Force stopping ${runningJobs.length} cron job(s) after ${timeout}ms timeout`);
          
          for (const job of runningJobs) {
            job.stop();
          }
        }
      }

      cronJobs.length = 0; // Clear the array
      logger.info(`📅 All cron jobs stopped`);
    }    // Stop Apollo Server
    if (apolloServer) {
      logger.info("🌐 Stopping GraphQL server...");
      await apolloServer.stop();
      apolloServer = null;
      logger.info("✅ GraphQL server stopped");
    }

    // Stop the WebSocket server
    if (serverCleanup) {
      logger.info("🔌 Stopping WebSocket server...");
      try {
        await serverCleanup.dispose();
        logger.info("✅ WebSocket server stopped");
      } catch (error: any) {
        // Handle the case where the WebSocket server is not running
        if (
          error.message &&
          error.message.includes("The server is not running")
        ) {
          logger.info("ℹ️ WebSocket server was already stopped");
        } else {
          logger.error("❌ Error stopping WebSocket server:", error);
          throw error;
        }
      }
    }

    // Close the HTTP server
    if (httpServer) {
      logger.info("🌍 Stopping HTTP server...");
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
        logger.info("✅ HTTP server stopped");
      } else {
        logger.info("ℹ️ HTTP server was not running");
      }
    }

    // Stop memory server (Qdrant Docker container)
    logger.info("🧠 Stopping memory server...");
    await stop_memory_server();
    logger.info("✅ Memory server stopped");

    // Close database connections
    logger.info("🗄️ Closing database connections...");
    const prisma = await getPrisma();
    await prisma.$disconnect();
    logger.info("✅ Database connections closed");

    logger.info("🎉 Brofty Core Server stopped successfully");
  } catch (error) {
    logger.error("❌ Error during server shutdown:", error);
    throw error;
  }
}
