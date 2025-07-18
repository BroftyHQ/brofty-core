import getPrisma from "../db/prisma/client.js";
import { AuthorizedGraphQLContext } from "../types/context.js";
import add_availble_mcp_tools from "./add_availble_mcp_tools.js";

export default async function rewrite_mcp_tools({
  context,
}: {
  context: AuthorizedGraphQLContext;
}) {
  const prisma = await getPrisma();
  // get all mcp installed from servers
  const mcp_installed = await prisma.mCPServer.findMany({});
  // for each mcp, get the tools
  for (const mcp of mcp_installed) {
    // rewrite the tools in the available tools manager
    await add_availble_mcp_tools({
      name: mcp.name,
      first_time: false,
      context: null,
    });
  }
}
