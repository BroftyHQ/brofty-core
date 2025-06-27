import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";

export async function getMessages(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const messages = await message_model.findAll({
    limit: 100,
    order: [["created_at", "DESC"]],
  });
  return messages.map((message: any) => {
    return {
      id: message.id,
      text: message.text,
      by: message.by,
      created_at: message.created_at.toString(),
    };
  });
}
