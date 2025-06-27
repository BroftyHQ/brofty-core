import { toolMap } from "../../tools/index.js";
import getMcpClient from "../../mcp/getMcpClient.js";
import logger from "../../common/logger.js";
import pubsub from "../../pubsub/index.js";
import { FunctionCache, ToolCall } from "./types.js";
import tool_search from "../../tools/tool_search.js";

export async function executeFunctionCalls({
  function_cache,
  tool_calls,
  id,
  initial_response_time,
  user_token,
}: {
  function_cache: { [key: number]: FunctionCache };
  tool_calls: ToolCall[];
  id: string;
  initial_response_time: string;
  user_token: string;
}): Promise<{
  has_function_calls: boolean;
  functions_suggestions: string[];
}> {
  let has_function_calls = false;
  let functions_suggestions = [];

  for await (const function_call of Object.values(function_cache)) {
    const { name, arguments: args } = function_call;

    const functionCallId = function_call.tool_call_id;
    if (
      !functionCallId ||
      typeof functionCallId !== "string" ||
      functionCallId.trim() === "" ||
      functionCallId == "null" ||
      functionCallId == "undefined"
    ) {
      console.warn(
        `Function call id is missing or invalid: '${functionCallId}'`
      );
      continue;
    }
    const functionName = name;
    const function_scope = functionName.split("___")[0];
    const scopedFunctionName = functionName.split("___")[1];
    let function_result = "";

    if (!scopedFunctionName) {
      console.warn(
        `Function '${functionName}' is not recognized or not available in toolMap.`
      );
      function_result = `Error: Function '${functionName}' is not recognized or not available.`;
      continue;
    }

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
      if (function_scope === "local") {
        if (scopedFunctionName === "tool_search") {
          const tools_searched = await tool_search({
            ...parsedArgs,
            user_token: user_token,
          });
          // Merge tools_searched with existing functions_suggestions, avoiding duplicates
          const combinedTools = [
            ...functions_suggestions,
            ...(tools_searched || []),
          ];
          functions_suggestions = [...new Set(combinedTools)];
          function_result = `Searched and found ${
            (tools_searched || []).length
          } new tools. Total unique tools: ${functions_suggestions.length}.`;
          logger.info(
            `Function 'tool_search' found ${tools_searched.length} tools. Total unique tools: ${functions_suggestions.length}`
          );
        } else {
          try {
            function_result = await toolMap[scopedFunctionName](parsedArgs);
          } catch (error) {
            console.error(
              `Function '${functionName}' returned an error:`,
              error
            );
            function_result = `Error: ${error.message}`;
          }
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
  return { has_function_calls, functions_suggestions };
}
