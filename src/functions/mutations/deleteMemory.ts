import getPrisma from "../../db/prisma/client.js";
import qdrant_client from "../../db/qdrant/client.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function deleteMemory(
  _parent: any,
  args: { id: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const { id } = args;
  const prisma = await getPrisma();
  const memory: any = await prisma.memories.findUnique({
    where: {
      id,
    },
  });
  if (!memory) {
    throw new Error(`Memory with id ${id} not found`);
  }

  try {
    // remove embedding from Qdrant
    await qdrant_client.delete("user", {
      points: [memory.id],
    });
  } catch (error) {
    console.error("Error removing embedding from Qdrant:", error);
  }

  // remove memory from database
  await prisma.memories.delete({
    where: {
      id,
    },
  });

  return true;
}
