import { DateTime } from "luxon";
import getOpenAIClient from "../../llms/openai.js";
import pubsub from "../../pubsub/index.js";
import get_openai_tool_schema from "../../tools/get_openai_tool_schema.js";
import logger from "../../common/logger.js";
import get_user_preferred_llm from "./get_user_preferred_llm.js";
import { Message } from "./types.js";
import getPrisma from "../../db/prisma/client.js";

export default async function get_response_stream({
  id,
  user_token,
  messages,
  functions_suggestions,
  enable_web_search,
}: {
  id: string;
  user_token: string;
  messages: Message[];
  functions_suggestions?: string[];
  enable_web_search?: boolean;
}) {
  const prisma = await getPrisma();

  const client = await getOpenAIClient(user_token);

  const tools = await get_openai_tool_schema({
    names: functions_suggestions,
  });
  const model = await get_user_preferred_llm();
  try {
    return await client.chat.completions.create({
      model: enable_web_search ? `${model}:online` : `${model}`,
      tools: tools,
      tool_choice: "auto",
      // @ts-ignore
      messages,
      stream: true,
    });
  } catch (error) {
    logger.error(`Error getting response: ${error.message}`);

    // addd it to ai response stream
    await prisma.message.update({
      where: { id },
      data: {
        text: `Error: ${error.message}`,
        updatedAt: DateTime.now().toMillis(),
      }
    });
    pubsub.publish(`MESSAGE_STREAM`, {
      messageStream: {
        type: "COMPLETE_MESSAGE",
        id,
        text: `Error: ${error.message}`,
        by: "AI",
        createdAt: DateTime.now().toMillis(),
      },
    });
    return null;
    // throw new Error(`Error getting response stream: ${error.message}`);
  }
}
