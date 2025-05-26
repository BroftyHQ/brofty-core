import prisma from "../../db/prisma";
import pubsub from "../../pubsub";
import OpenAI from "openai";
import add_to_recent_messages from "@/src/cache/add_to_recent_messages";
import { OPENAI_KEY } from "@/src/common/constants";
import get_stm from "@/src/memory/get_stm";


const client = new OpenAI({
  apiKey:OPENAI_KEY,
});


export default async function generate_response(
  id,
  initial_response_time,
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
    `,
    stream: true,
  });
  for await (const event of stream) {
    if (event.type == "response.output_text.delta") {
      pubsub.publish(`MESSGAE_STREAM:${user}`, {
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
      pubsub.publish(`MESSGAE_STREAM:${user}`, {
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
