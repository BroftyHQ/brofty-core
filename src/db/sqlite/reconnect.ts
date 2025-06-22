import sequelize from "./client.js";
import logger from "../../common/logger.js";

/**
 * Ensures the database connection is active and ready to use
 * This function will attempt to reconnect if needed
 */
export async function ensureDBConnection(): Promise<void> {
  try {
    // Test the connection
    await sequelize.authenticate();
  } catch (error) {
    logger.info("Database connection lost, attempting to reconnect...");
    try {
      // Close any existing connection first
      await sequelize.close();
    } catch (closeError) {
      // Ignore close errors
    }
    
    // Reconnect by creating a new connection
    await sequelize.authenticate();
    logger.info("Database reconnected successfully");
  }
}

/**
 * Safely sync the database with error handling for closed connections
 */
export async function safeDatabaseSync(): Promise<void> {
  try {
    await ensureDBConnection();
    await sequelize.sync({ alter: true, logging: false });
  } catch (error) {
    logger.error("Failed to sync database:", error);
    throw error;
  }
}
