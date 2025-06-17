import add_availble_mcp_tools from "../../mcp/add_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function syncMCPServerTools(
  _parent: any,
  _args: any,
  _context: AuthorizedGraphQLContext,
  _info: any
) {
  const { name } = _args;
  // check if name is provided
  if (!name) {
    throw new Error("MCP server name is required");
  }
  await add_availble_mcp_tools(name);
  return true;
}
