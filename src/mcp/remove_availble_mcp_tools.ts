import logger from "../common/logger.js";
import getPrisma from "../db/prisma/client.js";
import qdrant_client from "../db/qdrant/client.js";

export async function remove_availble_mcp_tools(name: string) {
  const prisma = await getPrisma();
  
  await prisma.tool.deleteMany({
    where: { mcpServer: name },
  });

  // remove tools from memory server
  await qdrant_client
    .delete("tools", {
      filter: {
        must: [
          {
            key: "mcp_server",
            match: {
              text: name,
            },
          },
        ],
      },
    })
    .catch((error) => {
      logger.error(
        `Failed to remove tools from memory server for MCP server '${name}': ${error.message}`
      );
    });
}
