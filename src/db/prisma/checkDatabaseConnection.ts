import getPrisma from "./client.js";
import logger from "../../common/logger.js";

/**
 * Checks the database connection by attempting to query the database
 * @returns Promise that resolves when database connection is successful
 * @throws Error when database connection fails
 */
async function checkDatabaseConnection(): Promise<void> {
  try {
    logger.info("Checking database connection...");
    
    const prisma = await getPrisma();
    
    // Perform a simple query to test the connection
    // Using $queryRaw with a simple SELECT 1 query that works on SQLite
    await prisma.$queryRaw`SELECT 1`;
    
    logger.info("✅ Database connection successful");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("❌ Database connection failed:", errorMessage);
    throw new Error(`Database connection failed: ${errorMessage}`);
  }
}

export default checkDatabaseConnection;