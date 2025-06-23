import { toolMap } from "../../tools/index.js";
import getMcpClient from "../../mcp/getMcpClient.js";
import logger from "../../common/logger.js";
import pubsub from "../../pubsub/index.js";
import { FunctionCache, ToolCall } from "./types.js";

export async function executeFunctionCalls(
  function_cache: { [key: number]: FunctionCache },
  tool_calls: ToolCall[],
  id: string,
  initial_response_time: string,
): Promise<boolean> {
  let has_function_calls = false;

  for await (const function_call of Object.values(function_cache)) {
    const { name, arguments: args } = function_call;

    const functionCallId = function_call.tool_call_id;
    const functionName = name;
    const function_scope = functionName.split("___")[0];
    const scopedFunctionName = functionName.split("___")[1];

    logger.info(
      `Function call detected: ${scopedFunctionName} with arguments: ${args}`
    );

    pubsub.publish(`MESSAGE_STREAM`, {
      messageStream: {
        type: "APPEND_MESSAGE",
        id,
        text: `Calling function: ${scopedFunctionName}\n\n`,
        by: "AI",
        created_at: initial_response_time.toString(),
      },
    });

    let parsedArgs = null;
    let function_log = "";
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
          function_result = await toolMap[scopedFunctionName](parsedArgs);
        } catch (error) {
          console.error(
            `Function '${functionName}' returned an error:`,
            error
          );
          function_result = `Error: ${error.message}`;
        }
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
      function_log += `${JSON.stringify(function_result)}`;
    }
    
    tool_calls.push({
      role: "tool",
      tool_call_id: functionCallId,
      content: function_log,
      name: name,
      arguments: args,
    });
  }

  has_function_calls = tool_calls.length > 0;
  return has_function_calls;
}
