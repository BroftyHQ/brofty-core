import getPrisma from "../../db/prisma/client.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function getAvailableMCPServers(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  const servers = await prisma.mCPServer.findMany();
  return servers.map((server: any) => {
    return {
      name: server.name,
      description: server.description,
      command: server.command,
      args: server.args,
      env: JSON.stringify(server.envs),
      status: server.status,
    };
  });
}
