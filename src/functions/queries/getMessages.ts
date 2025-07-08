import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";
import { Op } from "sequelize";
import authorized_user_initialization from "../authorized_user_initialization.js";

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

    if (messages.length === 0) {
      // this might be the first request from user
      // check user intialization
      authorized_user_initialization({
        user_token: context.user.token,
      });
    }
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
