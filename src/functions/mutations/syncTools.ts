import logger from "../../common/logger.js";
import qdrant_client from "../../db/qdrant/client.js";
import { mcp_server_model, tools_model } from "../../db/sqlite/models.js";
import create_group_embeddings from "../../llms/create_group_embeddings.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function syncTools(
  _parent: any,
  _args: { mcp_server_name?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  let tools = [];

  if (_args && _args.mcp_server_name) {
    tools = await tools_model.findAll({
      where: {
        mcp_server: _args.mcp_server_name,
      },
    });
  } else {
    // remove all tools from Qdrant
    await qdrant_client.delete("tools", {
      wait: true,
      filter: {},
    });
    tools = await tools_model.findAll();
  }

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
      mcp_description
        ? `\n This tool is from ${mcp_server} - ${mcp_description}`
        : ""
    }`;

    embedding_inputs.push({
      id: tool.id,
      text: embedding_input,
    });

    tool_metadata[tool.id] = {
      tool,
      name: `${mcp_server}___${tool.name}`,
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
      id: embedding.id,
      vector: embedding.embedding,
      payload: {
        id: embedding.id,
        name: metadata.name,
        mcp_server: metadata.mcp_server,
        embedding_input: metadata.embedding_input,
      },
    };
  });

  // Batch upsert to Qdrant
  try {
    await qdrant_client.upsert("tools", { points });
    logger.info(`Successfully synced ${points.length} tools to memory`);
  } catch (error: any) {
    logger.error(`Error upserting tools to memory: ${error.message}`);
    return false;
  }
  return true;
}
