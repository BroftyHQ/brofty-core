import pubsub from "../../pubsub/index.js";
import get_response_stream from "./get_response_stream.js";
import get_stm from "../../memory/get_stm.js";
import { toolMap } from "../../tools/index.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";

export default async function generate_response(
  id,
  messsage,
  initial_response_time,
  user,
  fn_log = "",
  recursion_count
) {
  let finalText = ``;
  let function_log = `${fn_log}\n`;
  let has_function_calls = false;

  if (recursion_count > 10) {
    await message_model.update(
      { text: `Skipped - exceeded max recursion calls`, updated_at: +new Date() },
      { where: { id } }
    );
    return;
  }
  recursion_count++;
  const current_stm = await get_stm(user);
  const stream:any = await get_response_stream({
    id,
    user,
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
  });
  if(stream === null) {
    return;
  }
  for await (const event of stream) {
    // console.log('Msg from', event);
    
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
      messsage,
      initial_response_time,
      user,
      (fn_log = function_log),
      recursion_count
    );

    return;
  }

  if (finalText.trim().length > 0) {
    const exisitingMessage:any = await message_model.findOne({
      where: {
        id,
      },
      attributes: ["text"],
    });
    if (!exisitingMessage) {
      return;
    }
    await message_model.update(
      { text: `${exisitingMessage.text} ${finalText}`, updated_at: DateTime.now().toMillis() },
      { where: { id } }
    );
  }
}
