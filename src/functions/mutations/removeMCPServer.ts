import { remove_availble_mcp_tools } from "../../mcp/remove_availble_mcp_tools.js";
import {
  get_available_servers,
  override_servers,
} from "../../mcp/servers_manager.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function removeMCPServer(
  _parent: any,
  args: { name: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const serversJson = get_available_servers();
  if (!serversJson.mcpServers || !serversJson.mcpServers[args.name]) {
    return false;
  }
  delete serversJson.mcpServers[args.name];
  override_servers(serversJson);
  remove_availble_mcp_tools(args.name);
  return true;
}
