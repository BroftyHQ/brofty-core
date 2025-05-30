import { DateTime } from "luxon";
import { message_model } from "../../db/sqlite/models.js";
import getOpenAIClient from "../../llms/openai.js";
import tools from "../../tools/index.js";
import pubsub from "../../pubsub/index.js";

export default async function get_response_stream({
  id,
  user,
  input,
}: {
  id: string;
  user: string;
  input: string;
}) {
  const client = getOpenAIClient();
  try {
    return await client.responses.create({
      model: "gpt-4.1-mini-2025-04-14",
      tools: tools,
      tool_choice: "auto",
      input,
      stream: true,
    });
  } catch (error) {
    // addd it to ai response stream
    await message_model.update(
      {
        text: `Error: ${error.error.message}`,
        updated_at: DateTime.now().toMillis(),
      },
      { where: { id } }
    );
    pubsub.publish(`MESSGAE_STREAM:${user}`, {
      messageStream: {
        type: "COMPLETE_MESSAGE",
        id,
        text: `Error: ${error.error.message}`,
        by: "AI",
        created_at: DateTime.now().toMillis(),
      },
    });
    return null;
    // throw new Error(`Error getting response stream: ${error.error.message}`);
  }
}
