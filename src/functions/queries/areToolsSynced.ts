import { AuthorizedGraphQLContext } from "../../types/context.js";
import { tools_model } from "../../db/sqlite/models.js";
import qdrant_client from "../../db/qdrant/client.js";

export async function areToolsSynced(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  // check is all tools in the database are in the qdrant collection
  const tool_count = await tools_model.count({});
  const qdrantTools = await qdrant_client.getCollection("tools");
  const qdrantToolCount = qdrantTools.points_count;
  return tool_count === qdrantToolCount;
}
