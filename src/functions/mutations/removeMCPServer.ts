import getPrisma from "../../db/prisma/client.js";
import { closeClient } from "../../mcp/getMcpClient.js";
import { remove_availble_mcp_tools } from "../../mcp/remove_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function removeMCPServer(
  _parent: any,
  args: { name: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  await closeClient(args.name);

  await prisma.mCPServer.delete({
    where: { name: args.name },
  });
  remove_availble_mcp_tools(args.name);
  return true;
}
