import pubsub from "../../pubsub/index.js";
import get_response_stream from "./get_response_stream.js";
import get_stm from "../../memory/get_stm.js";
import { toolMap } from "../../tools/index.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import logger from "../../common/logger.js";
import getMcpClient from "../../mcp/getMcpClient.js";

let chunk_cache: string = ``;
type FunctionCache = {
  name: string;
  arguments: string;
};

let function_cache: {
  [key: number]: FunctionCache;
} = {};

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
  let initial_fn_log_length = fn_log.length;
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

      if (
        first_choice.delta.content === null &&
        first_choice.delta.tool_calls
      ) {
        // console.log(
        //   `Tool calls detected: ${JSON.stringify(
        //     first_choice.delta.tool_calls,
        //     null,
        //     2
        //   )}`
        // );
        if (first_choice.delta.tool_calls[0].function.name) {
          const index = first_choice.delta.tool_calls[0].index;
          if (!function_cache[index]) {
            function_cache[index] = {
              name: "",
              arguments: "",
            };
          }
          function_cache[index].name =
            first_choice.delta.tool_calls[0].function.name;
        }
        if (first_choice.delta.tool_calls[0].function.arguments) {
          const index = first_choice.delta.tool_calls[0].index;
          if (function_cache[index]) {
            function_cache[index].arguments +=
              first_choice.delta.tool_calls[0].function.arguments;
          }
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
        } else if (Object.keys(function_cache).length > 0) {
          
          for await (const function_call of Object.values(function_cache)) {
            const { name, arguments: args } = function_call;
            logger.info(
              `Function call detected: ${name} with arguments: ${args}`
            );

            const functionName = name;
            const function_scope = functionName.split("___")[0];
            const scopedFunctionName = functionName.split("___")[1];
            // console.log(`Function scope: ${function_scope}, Scoped function name: ${scopedFunctionName}`);

            
            pubsub.publish(`MESSGAE_STREAM`, {
              messageStream: {
                type: "APPEND_MESSAGE",
                id,
                text: `Calling function: ${scopedFunctionName}\n\n`,
                // text: `Calling function: ${name}\n with arguments: ${args}\n\n`,
                by: "AI",
                created_at: initial_response_time.toString(),
              },
            });

            function_log += `\n\nFunction call: ${functionName} with arguments: ${JSON.stringify(
              args
            )}`;
            let parsedArgs = null;
            try {
              parsedArgs = JSON.parse(args);
            } catch (error) {
              console.error(
                `Error parsing function arguments for '${functionName}':`,
                error
              );
              function_log += `\n\nError parsing arguments: ${error.message}`;
              parsedArgs = null;
            }

            if (parsedArgs) {
              let function_result = "";
              if (function_scope === "local") {
                try {
                  function_result = await toolMap[scopedFunctionName](
                    parsedArgs
                  );
                } catch (error) {
                  console.error(
                    `Error calling local function '${functionName}':`,
                    error
                  );
                  function_result = `Error: ${error.message}`;
                }
              } else {
                // For MCP functions, we need to call the MCP server
                const mcp = await getMcpClient({ name: function_scope });
                if (!mcp) {
                  console.error(
                    `MCP client for '${function_scope}' not found.`
                  );
                  function_result = `Error: MCP client for '${function_scope}' not found.`;
                  continue;
                } else {
                  try {
                    // logger.info(
                    //   `Calling MCP function '${scopedFunctionName}' with arguments: ${JSON.stringify(arg)}`
                    // );
                    const res = await mcp.callTool({
                      name: scopedFunctionName,
                      arguments: parsedArgs,
                    });
                    function_result = JSON.stringify(res);
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
            }
          }
          has_function_calls = initial_fn_log_length < function_log.length;
          // clear the function cache
          function_cache = {};
        }
      }
    } else {
      console.log(`Unhandled event type: ${event.object}`);
    }
  }

  if (has_function_calls) {
    // logger.info('Function calls detected, generating response with function log');
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
