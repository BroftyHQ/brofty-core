import { AuthorizedGraphQLContext } from "../../types/context.js";
import { tools_model } from "../../db/sqlite/models.js";
import qdrant_client from "../../db/qdrant/client.js";
import logger from "../../common/logger.js";
import { log } from "electron-builder";

export async function areToolsSynced(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  // check is all tools in the database are in the qdrant collection
  const tools:any = await tools_model.findAll({
    attributes: ["id"],
    raw: true,
  });
  const tool_ids = tools.map((tool) => tool.id);
  
  const qdrantTools = await qdrant_client.retrieve("tools", {
    ids: tool_ids,
    with_payload: false,
  });
  
  return qdrantTools.length === tool_ids.length;
}
