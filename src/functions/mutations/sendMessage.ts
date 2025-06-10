import { nanoid } from "nanoid";
import pubsub from "../../pubsub/index.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import generate_response from "../llm/generate_response.js";

export async function sendMessage(_parent: any, args: { message: string }, context: AuthorizedGraphQLContext, _info: any) {
  const message: any = await message_model.create({
    id: nanoid(),
    text: args.message,
    by: "User",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
  });
  pubsub.publish(`MESSGAE_STREAM:${context.user.token}`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "You",
      id: message.id,
      text: message.text,
      created_at: message.createdAt.toString(),
    },
  });

  const response: any = await message_model.create({
    id: nanoid(),
    text: "",
    by: "AI",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
  });
  pubsub.publish(`MESSGAE_STREAM:${context.user.token}`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "AI",
      id: response.id,
      text: "",
      created_at: response.createdAt.toString(),
    },
  });
  generate_response(
    response.id,
    args.message,
    response.createdAt.toString(),
    context.user.token,
    "",
    0
  );
  return message;
}
