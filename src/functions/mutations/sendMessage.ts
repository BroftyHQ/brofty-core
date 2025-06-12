import { nanoid } from "nanoid";
import pubsub from "../../pubsub/index.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import generate_response from "../llm/generate_response.js";
import { getPreference } from "../../user_preferences/index.js";

export async function sendMessage(
  _parent: any,
  args: { message: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const message: any = await message_model.create({
    id: nanoid(),
    text: args.message,
    by: "User",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
  });
  pubsub.publish(`MESSGAE_STREAM`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "You",
      id: message.id,
      text: message.text,
      created_at: message.created_at.toString(),
    },
  });

  const response: any = await message_model.create({
    id: nanoid(),
    text: "",
    by: "AI",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
  });
  pubsub.publish(`MESSGAE_STREAM`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "AI",
      id: response.id,
      text: "",
      created_at: message.created_at.toString(),
    },
  });
  generate_response({
    id: response.id,
    user_token: context.user.token,
    messsage: args.message,
    initial_response_time: message.created_at.toString(),
    fn_log: "",
    recursion_count: 0,
  });
  return message;
}
