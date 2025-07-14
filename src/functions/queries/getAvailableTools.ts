import getPrisma from "../../db/prisma/client.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function getAvailableTools(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  const tools = await prisma.tool.findMany();
  return tools;
}
