import add_availble_mcp_tools from "./add_availble_mcp_tools.js";
import { get_available_servers } from "./servers_manager.js";

export default async function rewrite_mcp_tools() {
  // get all mcp installed from servers
  const mcp_installed = get_available_servers();
  // for each mcp, get the tools
  for (const mcp of mcp_installed.mcpServers || []) {
    // rewrite the tools in the available tools manager
    await add_availble_mcp_tools(mcp.name);
  }
}
