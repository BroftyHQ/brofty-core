import { tools_model } from "../db/sqlite/models.js";
import logger from "../common/logger.js";
import default_tools from "../tools/default_tools.js";
import qdrant_client from "../db/qdrant/client.js";
import { randomUUID } from "crypto";

const QDRANT_MANDATORY_COLLECTIONS = ["user", "tools"];

// This function runs every time core server starts

export default async function user_initialization(): Promise<void> {
  // create mandatory collections in Qdrant if they do not exist
  for await (const collectionName of QDRANT_MANDATORY_COLLECTIONS) {
    await qdrant_client.getCollection(collectionName)
    .catch(async (error) => {
      if (error.message.includes("Not Found")) {
        await qdrant_client.createCollection(collectionName, {
          vectors: {
            size: 1536, // Size for text-embedding-ada-002
            distance: "Cosine", // Use cosine distance for similarity
            on_disk: true,
          },
        });
        logger.info(`Collection '${collectionName}' created.`);
      } else {
        logger.error(
          `Error checking collection '${collectionName}': ${error.message}`
        );
      }
    });
  }
  // create default tools

  // create tool for each tool in default_tools.json
  for (const tool of default_tools) {
    const db_tool = await tools_model.findOne({
      where: {
        name: tool.name,
      },
    });
    if (db_tool) {
      continue;
    }
    // logger.info(`Creating tool: ${tool.name}`);
    await tools_model.findOrCreate({
      where: {
        name: tool.name,
      },
      defaults: {
        id: randomUUID(),
        name: tool.name,
        description: tool.description,
        defination: tool,
        mcp_server: "local",
      },
    });
  }
}
