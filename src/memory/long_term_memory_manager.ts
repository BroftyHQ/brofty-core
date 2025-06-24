import { message_model, message_summary_model } from "../db/sqlite/models.js";
import { DateTime } from "luxon";
import logger from "../common/logger.js";
import { getPreference, setPreference } from "../user_preferences/index.js";
import { Op } from "sequelize";
import getOpenAIClient from "../llms/openai.js";

export async function manageLongTermMemory(user_token: string): Promise<void> {
  const ltm_cursor_str = await getPreference("long_term_memory_cursor");
  const ltm_cursor = parseInt(ltm_cursor_str) || null;
  
  if (ltm_cursor) {
    // get all messages after the cursor limit 20 and summarize
    const messagesAfterCursor = await message_model.findAll({
      where: {
        created_at: {
          [Op.gt]: ltm_cursor,
        },
      },
      order: [["created_at", "DESC"]],
      limit: 20, // Limit to 20 messages
    });
    
    if (messagesAfterCursor.length < 20) {
      return;
    }
    
    const summarized = await summarizeMessages(user_token, messagesAfterCursor);
    if (summarized) {
      // update the cursor to the last message created_at timestamp
      const lastMessage: any = messagesAfterCursor[0];
      await setPreference(
        "long_term_memory_cursor",
        lastMessage.created_at.toString()
      );
    }
  } else {
    // get last 20 messages and summarize
    // this is the first time we are summarizing long term memory
    const messages = await message_model.findAll({
      order: [["created_at", "DESC"]],
      limit: 20,
    });

    if (messages.length < 20) {
      return;
    }
    
    const summarized = await summarizeMessages(user_token, messages);
    if (summarized) {
      const lastMessage: any = messages[0];
      await setPreference(
        "long_term_memory_cursor",
        lastMessage.created_at.toString()
      );
    }
  }
}

async function summarizeMessages(
  user_token: string,
  messages: any[]
): Promise<boolean> {
  const final_statements: string[] = [];
  for await (const element of messages) {
    if (element.by === "User") {
      final_statements.push(`${element.text}`);
    }
  }
  
  if (final_statements.length === 0) {
    return false;
  }

  const client = await getOpenAIClient(user_token);
  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that summarizes user messages.",
      },
      {
        role: "user",
        content: `Summarize the following user messages:\n\n ${final_statements.join(
          "\n "
        )}`,
      },
    ],
    stream: false,
  });
  
  if (!response || !response.choices || response.choices.length === 0) {
    logger.error("Failed to get a valid response from the LLM for summarization.");
    return false;
  }

  await message_summary_model.create({
    id: `summary-${DateTime.now().toMillis()}`,
    summary: response.choices[0].message.content,
    first_message_id: messages[messages.length - 1].id,
    last_message_id: messages[0].id,
    created_at: DateTime.now().toMillis(),
  });

  return true;
}
