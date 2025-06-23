import get_response_stream from "./get_response_stream.js";
import {
  message_model,
} from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import logger from "../../common/logger.js";
import buildMessages from "./build_messages.js";
import { StreamProcessor } from "./stream_processor.js";
import { executeFunctionCalls } from "./execute_function_calls.js";
import { GenerateResponseParams } from "./types.js";

export default async function generate_response({
  id,
  user_token,
  messsage,
  initial_response_time,
  tool_calls = [],
  recursion_count = 0,
}: GenerateResponseParams) {
  let finalText = "";

  if (recursion_count > 10) {
    await message_model.update(
      {
        text: `Skipped - exceeded max recursion calls`,
        updated_at: +new Date(),
      },
      { where: { id } }
    );
    logger.warn(
      `Recursion limit exceeded for message ID ${id}. Skipping further processing.`
    );
    return;
  }

  recursion_count++;

  // Build messages for the LLM
  const messages = await buildMessages(messsage, tool_calls);

  // Get response stream
  const stream = await get_response_stream({
    id,
    user_token,
    messages,
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
      has_function_calls = await executeFunctionCalls(
        streamProcessor.getFunctionCache(),
        tool_calls,
        id,
        initial_response_time
      );
      streamProcessor.clearFunctionCache();
    }
  }

  // Handle recursive function calls
  if (has_function_calls) {
    generate_response({
      id,
      user_token,
      messsage,
      initial_response_time,
      tool_calls,
      recursion_count,
    });
    return;
  }

  // Update message with final text
  if (finalText.trim().length > 0) {
    const exisitingMessage: any = await message_model.findOne({
      where: { id },
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
     // long term memory management
  }
}
