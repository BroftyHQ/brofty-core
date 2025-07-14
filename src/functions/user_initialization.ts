import logger from "../common/logger.js";
import default_tools from "../tools/default_tools.js";
import qdrant_client from "../db/qdrant/client.js";
import { randomUUID } from "crypto";
import getPrisma from "../db/prisma/client.js";

const QDRANT_MANDATORY_COLLECTIONS = ["user", "tools"];

// This function runs every time core server starts

export default async function user_initialization(): Promise<void> {
  const prisma = await getPrisma();

  // create mandatory collections in Qdrant if they do not exist
  for await (const collectionName of QDRANT_MANDATORY_COLLECTIONS) {
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
  }

  // create tool for each tool in default_tools.json
  for (const tool of default_tools) {
    await prisma.tool.upsert({
      where: {
        name_mcpServer: {
          name: tool.name,
          mcpServer: "local",
        },
      },
      create: {
        id: randomUUID(),
        name: tool.name,
        description: tool.description,
        defination: tool,
        mcpServer: "local",
      },
      update: {
        description: tool.description,
        defination: tool,
      },
    });
  }
}
