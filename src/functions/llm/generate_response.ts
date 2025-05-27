import prisma from "../../db/prisma";
import pubsub from "../../pubsub";
import OpenAI from "openai";
import add_to_recent_messages from "@/src/cache/add_to_recent_messages";
import { OPENAI_KEY } from "@/src/common/constants";
import get_stm from "@/src/memory/get_stm";
import tools, { toolMap } from "@/src/tools";

const client = new OpenAI({
  apiKey: OPENAI_KEY,
});

export default async function generate_response(
  id,
  initial_response_time,
  user,
  fn_log = "",
  recursion_count
) {
  let finalText = ``;
  let function_log = `${fn_log}\n`;
  let has_function_calls = false;

  if (recursion_count > 10) {
        await prisma.message.update({
      where: {
        id,
      },
      data: {
        content: `Skipped - exceeded max recusion calls`,
        updatedAt: +new Date(),
      },
    });

    return;
  }
  recursion_count++;
  const current_stm = await get_stm(user);
  const stream = await client.responses.create({
    model: "gpt-4.1-mini-2025-04-14",
    tools: tools,
    tool_choice: "auto",
    input: `
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
        `
        : ""
    }

    ${fn_log}
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
        by: "AI",
        content: finalText,
      });
    } else if (event.type == "response.function_call_arguments.delta") {
      // console.log(`Function call arguments delta: ${JSON.stringify(event)}`);
    } else if (event.type == "response.function_call_arguments.done") {
      // console.log(`Function call arguments: ${JSON.stringify(event)}`);
    } else if (event.type == "response.output_item.done") {
      if (event.item.type == "function_call") {
        function_log += `\n\nFunction call: ${event.item.name} with arguments: ${event.item.arguments}`;
        pubsub.publish(`MESSGAE_STREAM:${user}`, {
          messageStream: {
            type: "APPEND_MESSAGE",
            id,
            text: `Calling function: ${event.item.name}\n with arguments: ${event.item.arguments}\n\n`,
            by: "AI",
            created_at: initial_response_time.toString(),
          },
        });
        const functionName = event.item.name;
        const functionArgs = event.item.arguments;
        const function_result = await toolMap[functionName](
          JSON.parse(functionArgs)
        );
        function_log += `\n\nFunction call result: ${JSON.stringify(
          function_result
        )}`;
        has_function_calls = true;
      } else {
        // console.log(`Unhandled output item type: ${event.item.type}`);
      }
    } else {
      // console.log(`Unhandled event type: ${event.type}`);
    }
  }

  if (has_function_calls) {
    generate_response(
      id,
      initial_response_time,
      user,
      (fn_log = function_log),
      recursion_count
    );

    return;
  }

  if (finalText.trim().length > 0) {
    const exisitingMessage = await prisma.message.findUnique({
      where: {
        id,
      },
    });
    if (!exisitingMessage) {
      return;
    }
    await prisma.message.update({
      where: {
        id,
      },
      data: {
        content: `${exisitingMessage.content} ${finalText}`,
        updatedAt: +new Date(),
      },
    });
  }
}
