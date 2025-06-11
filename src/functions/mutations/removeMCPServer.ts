import { mcp_server_model } from "../../db/sqlite/models.js";
import { remove_availble_mcp_tools } from "../../mcp/remove_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function removeMCPServer(
  _parent: any,
  args: { name: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  await mcp_server_model.destroy({
    where: { name: args.name },
  });
  remove_availble_mcp_tools(args.name);
  return true;
}
