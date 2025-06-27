import { AuthorizedGraphQLContext } from "../../types/context.js";
import { tools_model } from "../../db/sqlite/models.js";

export async function getAvailableTools(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const tools = await tools_model.findAll({});
  return tools;
}
