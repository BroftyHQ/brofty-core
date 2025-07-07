import logger from "../../common/logger.js";
import qdrant_client from "../../db/qdrant/client.js";
import { mcp_server_model, tools_model } from "../../db/sqlite/models.js";
import create_group_embeddings from "../../llms/create_group_embeddings.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function syncTools(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  // remove all tools from Qdrant
  await qdrant_client.delete("tools", {
    wait: true,
    filter: {},
  });

  const tools: any = await tools_model.findAll();

  // Prepare embedding inputs for batch processing
  const embedding_inputs: { id: string; text: string }[] = [];
  const tool_metadata: { [key: string]: any } = {};

  for (const tool of tools) {
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

    const embedding_input = `${mcp_server}\n${tool.description}${
      mcp_description ? `\n This tool is from ${mcp_description}` : ""
    }`;
    
    const tool_id = `${mcp_server}___${tool.name}`;
    embedding_inputs.push({
      id: tool_id,
      text: embedding_input,
    });
    
    tool_metadata[tool_id] = {
      tool,
      mcp_server,
      embedding_input,
    };
  }

  // Create embeddings for all tools in batch
  const res = await create_group_embeddings({
    user_token: context.user.token,
    embedding_inputs,
  });

  if (!res || !res.embeddings) {
    logger.error("Failed to create embeddings: No embeddings returned");
    return false;
  }

  // Prepare points for Qdrant upsert
  const points = res.embeddings.map((embedding, index) => {
    const metadata = tool_metadata[embedding.id];
    return {
      id: index + 1,
      vector: embedding.embedding,
      payload: {
        name: embedding.id,
        mcp_server: metadata.mcp_server,
        embedding_input: metadata.embedding_input,
      },
    };
  });

  // Batch upsert to Qdrant
  try {
    await qdrant_client.upsert("tools", { points });
    logger.info(`Successfully synced ${points.length} tools to Qdrant`);
  } catch (error: any) {
    logger.error(`Error upserting tools to Qdrant: ${error.message}`);
    return false;
  }
  return true;
}
