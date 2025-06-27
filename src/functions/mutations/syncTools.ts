import logger from "../../common/logger.js";
import qdrant_client from "../../db/qdrant/client.js";
import { mcp_server_model, tools_model } from "../../db/sqlite/models.js";
import getOpenAIClient from "../../llms/openai.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function syncTools(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const openaiClient = await getOpenAIClient(context.user.token);

  const tools: any = await tools_model.findAll();

  for await (const tool of tools) {
    const mcp_server = tool.mcp_server || "local";
    let mcp_description = "";
    if (mcp_server !== "local") {
      // fetch MCP server description if available
      const mcp: any = await mcp_server_model.findOne({
        where: { name: mcp_server },
        attributes: ["name", "description"],
      });

      if (mcp) {
        mcp_description = `${mcp.name} - ${mcp.description || ""}`;
      }
    }

    const embedding_input = `${mcp_description}\n${tool.description}`;
    const res: any = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002",
      input: embedding_input,
    });
    if (!res || !res.embedding) {
      logger.error(
        `Failed to create embedding for tool '${tool.name}': No embedding returned`
      );
      continue;
    }

    // add tool details to Qdrant
    await qdrant_client
      .upsert("tools", {
        points: [
          {
            // get index of tool as id
            id: tools.indexOf(tool) + 1,
            vector: res.embedding,
            payload: {
              name: `${mcp_server}___${tool.name}`,
              embedding_input,
            },
          },
        ],
      })
      .catch((error) => {
        logger.error(
          `Error upserting tool '${tool.name}' to Qdrant: ${error.message}`
        );
      });
  }
  return true;
}
