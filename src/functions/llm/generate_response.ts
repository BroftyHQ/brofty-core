import get_response_stream from "./get_response_stream.js";
import { DateTime } from "luxon";
import logger from "../../common/logger.js";
import buildMessages from "./build_messages.js";
import { StreamProcessor } from "./stream_processor.js";
import { executeFunctionCalls } from "./execute_function_calls.js";
import { manageLongTermMemory } from "../../memory/long_term_memory_manager.js";
import { GenerateResponseParams } from "./types.js";
import pubsub from "../../pubsub/index.js";
import getPrisma from "../../db/prisma/client.js";

export default async function generate_response({
  id,
  user_token,
  user_query,
  user_message,
  initial_response_time,
  tool_calls = [],
  recursion_count = 0,
  functions_suggestions = [],
  enable_web_search = false,
}: GenerateResponseParams) {
  const prisma = await getPrisma();
  if (recursion_count > 0) {
    pubsub.publish(`MESSAGE_STREAM`, {
      messageStream: {
        type: "APPEND_MESSAGE",
        id,
        text: `\n\`Agent Execution Iteration ${recursion_count}\`\n`,
        by: "AI",
        createdAt: initial_response_time.toString(),
      },
    });
  }

  let finalText = "";

  if (recursion_count > 10) {
    pubsub.publish(`MESSAGE_STREAM`, {
      messageStream: {
        type: "COMPLETE_MESSAGE",
        id,
        text: `Recursion limit exceeded. Skipping further processing`,
        by: "AI",
        createdAt: DateTime.now().toMillis(),
      },
    });
    await prisma.message.update({
      where: { id },
      data: {
        text: `Skipped - exceeded max recursion calls`,
        updatedAt: +new Date(),
      }
    });
    logger.warn(
      `Recursion limit exceeded for message ID ${id}. Skipping further processing.`
    );
    return;
  }

  recursion_count++;

  // Build messages for the LLM
  const messages = await buildMessages({
    user_query,
    user_message,
    tool_calls,
    user_token,
  });

  // console.log(messages);
  // console.log(messages[messages.length - 1].content);

  // Get response stream
  const stream = await get_response_stream({
    id,
    user_token,
    messages,
    functions_suggestions,
    enable_web_search,
  });

  if (stream === null) {
    return;
  }

  const streamProcessor = new StreamProcessor();
  let has_function_calls = false;

  // Process stream events
  for await (const event of stream) {
    const result = streamProcessor.processStreamEvent(
      event,
      id,
      initial_response_time
    );

    if (result.hasContent) {
      finalText += result.finalText;
    } else if (result.hasFunctionCalls) {
      const fn_call = await executeFunctionCalls({
        function_cache: streamProcessor.getFunctionCache(),
        tool_calls: tool_calls,
        id: id,
        initial_response_time: initial_response_time,
        user_token: user_token,
      });
      has_function_calls = fn_call.has_function_calls;
      functions_suggestions = [
        ...functions_suggestions,
        ...fn_call.functions_suggestions,
      ];
      streamProcessor.clearFunctionCache();
    }
  }

  // Handle recursive function calls
  if (has_function_calls) {
    generate_response({
      id,
      user_token,
      user_query,
      user_message,
      initial_response_time,
      tool_calls,
      recursion_count,
      functions_suggestions,
    });
    return;
  }

  // Update message with final text
  if (finalText.trim().length > 0) {
    const exisitingMessage: any = await prisma.message.findUnique({
      where: { id },
      select: { text: true },
    });

    if (!exisitingMessage) {
      return;
    }

    await prisma.message.update({
      where: { id },
      data: {
        text: `${exisitingMessage.text} ${finalText}`,
        updatedAt: DateTime.now().toMillis(),
      }
    });
    // long term memory management
    await manageLongTermMemory(user_token);
  }
}
