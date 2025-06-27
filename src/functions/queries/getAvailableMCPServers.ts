import { AuthorizedGraphQLContext } from "../../types/context.js";
import { mcp_server_model } from "../../db/sqlite/models.js";

export async function getAvailableMCPServers(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  return (await mcp_server_model.findAll()).map((server: any) => {
    return {
      name: server.name,
      command: server.command,
      args: server.args,
      env: JSON.stringify(server.envs),
      status: server.status,
    };
  });
}
