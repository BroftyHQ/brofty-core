import { AuthorizedGraphQLContext } from "../../types/context.js";
import { memories_model } from "../../db/sqlite/models.js";

export async function getUserMemories(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const memories = await memories_model.findAll({
    order: [["created_at", "DESC"]],
    limit: 100,
  });
  return memories.map((memory: any) => ({
    id: memory.id,
    content: memory.content,
    index: memory.index,
    created_at: memory.created_at.toString(),
  }));
}
