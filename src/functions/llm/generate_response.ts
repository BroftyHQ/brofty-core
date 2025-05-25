import prisma from "../../db/prisma";
import pubsub from "../../pubsub";

import OpenAI from "openai";
const client = new OpenAI({
  apiKey:
    "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",
});

export default async function generate_response(
  id,
  initial_response_time,
  text,
  user
) {
  let finalText = ``;

  const stream = await client.responses.create({
    model: "o4-mini-2025-04-16",
    input: text,
    reasoning:{
      effort:"low"
    },
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
