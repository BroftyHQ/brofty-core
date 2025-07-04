import get_ltm from "../../memory/get_ltm.js";
import get_mtm from "../../memory/get_mtm.js";
import get_stm from "../../memory/get_stm.js";
import { Message, ToolCall } from "./types.js";

export default async function buildMessages({
  user_query,
  user_message,
  tool_calls = [],
  user_token,
}: {
  user_query: string;
  user_message: Message;
  tool_calls: ToolCall[];
  user_token: string;
}): Promise<Message[]> {
  const current_stm = await get_stm();
  const medium_term_memory = await get_mtm();
  const long_term_memory = await get_ltm({
    query: user_query,
    user_token,
  });

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a helpful assistant operating in an agentic loop, capable of performing recursive reasoning and multistep operations to solve user requests.
      You have access to recent messages in this chat.
      Keep your responses concise and focused, unless the user requests a detailed explanation.
      When providing code, ensure it is correct, functional, and properly formatted.
      You have access to thousands of tools that can help answer user questions.
      Before refusing a request, you must always check whether any available tools could help you complete it.
      Use the search tool broadly to discover tools related to the user's task.
      Only if you confirm that no tools are available or appropriate should you tell the user you cannot fulfill the request.
      Remember that you are allowed to plan multi-step reasoning or tool use to achieve the user's goal whenever possible.
      If you are still unable to help after searching, admit it honestly and do not invent information. Do not try to calculate or guess answers that you do not know.
      If you are unsure about something, ask the user for clarification or more information.`,
    },
    ...long_term_memory,
    ...medium_term_memory,
    ...current_stm,
    user_message,
  ];

  if (tool_calls.length > 0) {
    messages.push({
      role: "assistant",
      content: null,
      tool_calls: tool_calls.map((tool_call) => ({
        id: tool_call.tool_call_id,
        type: "function",
        function: {
          name: tool_call.name,
          arguments: tool_call.arguments,
        },
      })),
    });

    // add tool calls to the messages
    for (const tool_call of tool_calls) {
      messages.push({
        role: "tool",
        tool_call_id: tool_call.tool_call_id,
        content: tool_call.content,
      });
    }
  }

  return messages;
}
