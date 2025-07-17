import getPrisma from "../../db/prisma/client.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function getUserMemories(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  const memories = await prisma.memories.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return memories.map((memory) => ({
    ...memory,
    createdAt: memory.createdAt.toString(),
  }));
}
