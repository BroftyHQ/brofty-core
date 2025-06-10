import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function addMCPServer(_parent: any, args: { name: string; command: string; args?: string[]; env?: string[] }, context: AuthorizedGraphQLContext, _info: any) {
  const fs = await import('fs/promises');
  const path = await import('path');
  const serversPath = path.resolve(process.cwd(), 'src/mcp/servers.json');
  const serversRaw = await fs.readFile(serversPath, 'utf-8');
  const serversJson = JSON.parse(serversRaw);
  if (!serversJson.mcpServers) serversJson.mcpServers = {};
  // Check if server with the same name already exists
  if (serversJson.mcpServers[args.name]) {
    throw new Error(`MCP server with name '${args.name}' already exists.`);
  }
  let envObj: Record<string, string> = {};
  if (args.env) {
    args.env.forEach((pair) => {
      const idx = pair.indexOf('=');
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
  await fs.writeFile(serversPath, JSON.stringify(serversJson, null, 2), 'utf-8');
  return {
    name: args.name,
    command: args.command,
    args: args.args || [],
    env: args.env || [],
  };
}
