import redis from "@/src/cache/redis";
import prisma from "../../db/prisma";
import pubsub from "../../pubsub";

import OpenAI from "openai";
import add_to_recent_messages from "@/src/cache/add_to_recent_messages";
const client = new OpenAI({
  apiKey:
    "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",
});

async function get_stm(user){
  const last_messages = await redis.lrange(`recent_messages:${user}`, 0, 9)
  if (last_messages.length === 0) {
    return '';
  }
  let final_stm = '';
  for await (const message of last_messages.reverse()) {
    const parsedMessage = JSON.parse(message);
    final_stm += `\n\n${parsedMessage.by}: ${parsedMessage.content}`;
  }
  return final_stm;
}

export default async function generate_response(
  id,
  initial_response_time,
  text,
  user
) {
  let finalText = ``;
  const current_stm = await get_stm(user);
  const stream = await client.responses.create({
    model: "gpt-4.1-mini-2025-04-14",
    input:`
    You are a helpful, concise assistant.
    You have access to the last couple of messages in this chat.
    Keep your responses focused and as brief as possible, unless the user requests detailed explanation.
    When responding with code, ensure it is correct and properly formatted.
    If you are unsure, say so honestly.
    ${
      current_stm.length > 0
        ? `
        Last messages in this chat:

        ${current_stm}
        `:""
    }

    current user message: ${text}
    `,
    stream: true,
  });
  for await (const event of stream) {
    if (event.type == "response.output_text.delta") {
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "APPEND_MESSAGE",
          id,
          text: event.delta,
          by: "AI",
          created_at: initial_response_time.toString(),
        },
      });
    } else if (event.type == "response.output_text.done") {
      finalText += event.text;
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "COMPLETE_MESSAGE",
          id,
          text: event.text,
          by: "AI",
          created_at: initial_response_time.toString(),
        },
      });
      await add_to_recent_messages({
        user,
        by:"AI",
        content: finalText,
      })
    }else{
      
      
    }
  }

  // add to db
  await prisma.message.create({
    data: {
      id,
      content: finalText,
      createdAt: initial_response_time,
      updatedAt: +new Date(),
      user,
      by: "AI",
    },
  });
}
