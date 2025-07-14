import { getInitializedClientsInfo, closeClient } from "../../mcp/getMcpClient.js";
import logger from "../../common/logger.js";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

export default async function cleanup_idle_mcp_clients(): Promise<void> {
  try {
    const clientsInfo = getInitializedClientsInfo();
    
    if (clientsInfo.length === 0) {
    //   logger.debug("No MCP clients are currently initialized.");
      return;
    }

    // logger.debug(`Checking ${clientsInfo.length} MCP client(s) for idle timeout.`);

    const clientsToClose: string[] = [];
    
    for (const clientInfo of clientsInfo) {
      if (clientInfo.lastUsedMs > IDLE_TIMEOUT_MS) {
        clientsToClose.push(clientInfo.name);
        logger.info(
          `MCP client '${clientInfo.name}' has been idle for ${Math.round(
            clientInfo.lastUsedMs / 1000 / 60
          )} minutes. Marking for cleanup.`
        );
      }
    }

    // Close idle clients
    for (const clientName of clientsToClose) {
      try {
        const closed = await closeClient(clientName);
        if (closed) {
          logger.info(`Successfully closed idle MCP client '${clientName}'.`);
        } else {
          logger.warn(`Failed to close MCP client '${clientName}' - client not found in cache.`);
        }
      } catch (error) {
        logger.error(
          `Error closing MCP client '${clientName}': ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  } catch (error) {
    logger.error(
      `Error during MCP client cleanup: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
