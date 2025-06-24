import qdrant_client from "../../db/qdrant/client.js";
import { memories_model } from "../../db/sqlite/models.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function deleteMemory(
  _parent: any,
  args: { id: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const { id } = args;
  const memory: any = await memories_model.findOne({
    where: {
      id,
    },
  });
  if (!memory) {
    throw new Error(`Memory with id ${id} not found`);
  }

  // remove embedding from Qdrant
  await qdrant_client.delete("user", {
    points: [memory.id],
  });

  // remove memory from SQLite
  await memories_model.destroy({
    where: {
      id,
    },
  });

  return true;
}
