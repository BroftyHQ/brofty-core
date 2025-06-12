import pubsub from "../../pubsub/index.js";
import get_response_stream from "./get_response_stream.js";
import get_stm from "../../memory/get_stm.js";
import { toolMap } from "../../tools/index.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import logger from "../../common/logger.js";
import getMcpClient from "../../mcp/getMcpClient.js";

let chunk_cache: string = ``;
let function_cache: {
  index: number;
  name: string;
  arguments: string;
} = {
  index: 0,
  name: "",
  arguments: "",
};

export default async function generate_response({
  id,
  user_token,
  messsage,
  initial_response_time,
  fn_log = "",
  recursion_count,
}: {
  id: string;
  user_token: string;
  messsage: string;
  initial_response_time: string;
  fn_log?: string;
  recursion_count?: number;
}) {
  let finalText = ``;
  let function_log = `${fn_log}\n`;
  let has_function_calls = false;

  if (recursion_count > 10) {
    await message_model.update(
      {
        text: `Skipped - exceeded max recursion calls`,
        updated_at: +new Date(),
      },
      { where: { id } }
    );
    return;
  }
  recursion_count++;
  const current_stm = await get_stm();
  const stream = await get_response_stream({
    id,
    user_token,
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
  if (stream === null) {
    return;
  }
  // console.log(stream);

  for await (const event of stream) {
    if (event.object === "chat.completion.chunk") {
      const first_choice = event.choices[0];
      if (first_choice.delta.content) {
        chunk_cache += event.choices[0].delta.content || "";
        pubsub.publish(`MESSGAE_STREAM`, {
          messageStream: {
            type: "APPEND_MESSAGE",
            id,
            text: event.choices[0].delta.content || "",
            by: "AI",
            created_at: initial_response_time.toString(),
          },
        });
      }

      if (first_choice.delta.content == null && first_choice.delta.tool_calls) {
        // console.log(`Tool calls detected: ${JSON.stringify(first_choice.delta.tool_calls, null, 2)}`);
        if (first_choice.delta.tool_calls[0].function.name) {
          function_cache.index = first_choice.delta.tool_calls[0].index;
          function_cache.name = first_choice.delta.tool_calls[0].function.name;
        }
        if (first_choice.delta.tool_calls[0].function.arguments) {
          function_cache.arguments +=
            first_choice.delta.tool_calls[0].function.arguments;
        }
      }

      if (first_choice.finish_reason != null) {
        if (chunk_cache.length > 0) {
          // chunks finished
          finalText += chunk_cache;
          pubsub.publish(`MESSGAE_STREAM`, {
            messageStream: {
              type: "COMPLETE_MESSAGE",
              id,
              text: chunk_cache,
              by: "AI",
              created_at: initial_response_time.toString(),
            },
          });
          chunk_cache = "";
        } else if (function_cache.name) {
          logger.info(
            `Function call detected: ${function_cache.name} with arguments: ${function_cache.arguments}`
          );
          function_log += `\n\nFunction call: ${function_cache.name} with arguments: ${function_cache.arguments}`;
          pubsub.publish(`MESSGAE_STREAM`, {
            messageStream: {
              type: "APPEND_MESSAGE",
              id,
              text: `Calling function: ${function_cache.name}\n with arguments: ${function_cache.arguments}\n\n`,
              by: "AI",
              created_at: initial_response_time.toString(),
            },
          });
          const functionName = function_cache.name;
          const function_scope = functionName.split("___")[0];
          const scopedFunctionName = functionName.split("___")[1];

          const functionArgs = function_cache.arguments;
          let function_result = "";
          if (function_scope === "local") {
            function_result = await toolMap[scopedFunctionName](
              JSON.parse(functionArgs)
            );
          } else {
            // For MCP functions, we need to call the MCP server
            const mcp = await getMcpClient({ name: function_scope });
            if (!mcp) {
              console.error(`MCP client for '${function_scope}' not found.`);
              function_result = `Error: MCP client for '${function_scope}' not found.`;
              continue;
            } else {
              try {
                const res = await mcp.callTool({
                  name: scopedFunctionName,
                  arguments: JSON.parse(functionArgs),
                });
                function_result = JSON.stringify(res, null, 2);
              } catch (error) {
                console.error(
                  `Error calling MCP function '${scopedFunctionName}':`,
                  error
                );
                function_result = `Error: ${error.message}`;
              }
            }
          }
          function_log += `\n\nFunction call result: ${JSON.stringify(
            function_result
          )}`;
          has_function_calls = true;
          function_cache.index = 0; // Reset index after processing
          function_cache.name = "";
          function_cache.arguments = "";
        }
      }
    } else {
      console.log(`Unhandled event type: ${event.object}`);
    }
  }

  if (has_function_calls) {
    generate_response({
      id,
      user_token,
      messsage,
      initial_response_time,
      fn_log: function_log,
      recursion_count,
    });

    return;
  }

  if (finalText.trim().length > 0) {
    const exisitingMessage: any = await message_model.findOne({
      where: {
        id,
      },
      attributes: ["text"],
    });
    if (!exisitingMessage) {
      return;
    }
    await message_model.update(
      {
        text: `${exisitingMessage.text} ${finalText}`,
        updated_at: DateTime.now().toMillis(),
      },
      { where: { id } }
    );
  }
}
