import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";
import { Op } from "sequelize";

const MAX_MESSAGES = 25;

export async function getMessages(
  _parent: any,
  _args: { cursor?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  let messages: any[] = [];
  if (_args.cursor) {
    messages = await message_model.findAll({
      where: {
        created_at: {
          [Op.lt]: Number(_args.cursor),
        },
      },
      order: [["created_at", "DESC"]],
      limit: MAX_MESSAGES,
    });
  } else {
    messages = await message_model.findAll({
      limit: MAX_MESSAGES,
      order: [["created_at", "DESC"]],
    });
  }
  return messages.map((message: any) => {
    return {
      id: message.id,
      text: message.text,
      by: message.by,
      files: message.files,
      created_at: message.created_at.toString(),
    };
  });
}
