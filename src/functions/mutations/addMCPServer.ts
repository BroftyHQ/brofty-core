import add_availble_mcp_tools from "../../mcp/add_availble_mcp_tools.js";
import {
  get_available_servers,
  override_servers,
} from "../../mcp/servers_manager.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function addMCPServer(
  _parent: any,
  args: { name: string; command: string; args?: string[]; env?: string[] },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const serversJson = get_available_servers();
  if (!serversJson.mcpServers) serversJson.mcpServers = {};
  // Check if server with the same name already exists
  if (serversJson.mcpServers[args.name]) {
    throw new Error(`MCP server with name '${args.name}' already exists.`);
  }
  let envObj: Record<string, string> = {};
  if (args.env) {
    args.env.forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > 0) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        envObj[k] = v;
      }
    });
  }
  serversJson.mcpServers[args.name] = {
    command: args.command,
    args: args.args || [],
    env: Object.keys(envObj).length ? envObj : undefined,
  };
  override_servers(serversJson);

  add_availble_mcp_tools(args.name);
  return {
    name: args.name,
    command: args.command,
    args: args.args || [],
    env: args.env || [],
  };
}
