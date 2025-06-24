import get_mtm from "../../memory/get_mtm.js";
import get_stm from "../../memory/get_stm.js";
import { Message, ToolCall } from "./types.js";

export default async function buildMessages(
  messsage: string,
  tool_calls: ToolCall[]
): Promise<Message[]> {
  const current_stm = await get_stm();
  const medium_term_memory = await get_mtm();

  const messages: Message[] = [
    {
      role: "system",
      content: `You are a helpful, concise assistant.
    You have access to the last couple of messages in this chat.
    Keep your responses focused and as brief as possible, unless the user requests detailed explanation.
    When responding with code, ensure it is correct and properly formatted.
    If you are unsure, say so honestly.`,
    },
    ...medium_term_memory,
    ...current_stm,
    {
      role: "user",
      content: messsage,
    },
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
