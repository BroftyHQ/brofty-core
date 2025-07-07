import logger from "../common/logger.js";
import qdrant_client from "../db/qdrant/client.js";
import { tools_model } from "../db/sqlite/models.js";

export async function remove_availble_mcp_tools(name: string) {
  await tools_model.destroy({
    where: { mcp_server: name },
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
