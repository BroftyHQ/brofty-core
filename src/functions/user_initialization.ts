import { DateTime } from "luxon";
import { getPreference, setPreference } from "../user_preferences/index.js";
import fs from "fs";
import { tools_model } from "../db/sqlite/models.js";
import logger from "../common/logger.js";
import default_tools from "../tools/default_tools.js";
import qdrant_client from "../db/qdrant/client.js";

export default async function user_initialization(): Promise<void> {
  // create "user" vector collection if it doesn't exist
  const collectionName = "user";
  await qdrant_client.getCollection(collectionName).catch(async (error) => {
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

  const is_initialized = await getPreference("is_initialized");
  if (is_initialized) {
    // User is already initialized, no action needed
    // logger.info("User is already initialized, skipping initialization.");
    return;
  }
  // set initialization flag as current timestamp
  await setPreference("is_initialized", DateTime.now().toMillis().toString());

  // create default tools

  // create tool for each tool in default_tools.json
  for (const tool of default_tools) {
    await tools_model.findOrCreate({
      where: {
        name: tool.name,
      },
      defaults: {
        name: tool.name,
        description: tool.description,
        defination: tool,
        mcp_server: "local",
      },
    });
  }
}
