import { remove_availble_mcp_tools } from "../../mcp/remove_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function removeMCPServer(_parent: any, args: { name: string }, context: AuthorizedGraphQLContext, _info: any) {
  const fs = await import('fs/promises');
  const path = await import('path');
  const serversPath = path.resolve(process.cwd(), 'src/mcp/servers.json');
  const serversRaw = await fs.readFile(serversPath, 'utf-8');
  const serversJson = JSON.parse(serversRaw);
  if (!serversJson.mcpServers || !serversJson.mcpServers[args.name]) {
    return false;
  }
  delete serversJson.mcpServers[args.name];
  await fs.writeFile(serversPath, JSON.stringify(serversJson, null, 2), 'utf-8');
  remove_availble_mcp_tools(args.name);
  return true;
}
