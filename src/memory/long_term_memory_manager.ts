import { DateTime } from "luxon";
import logger from "../common/logger.js";
import { getPreference, setPreference } from "../user_preferences/index.js";
import getOpenAIClient from "../llms/openai.js";
import create_memories from "./create_memories.js";
import getPrisma from "../db/prisma/client.js";

export async function manageLongTermMemory(user_token: string): Promise<void> {
  const ltm_cursor_str = await getPreference("long_term_memory_cursor");
  const ltm_cursor = parseInt(ltm_cursor_str) || null;
  const prisma = await getPrisma();

  if (ltm_cursor) {
    // get all messages after the cursor limit 20 and summarize
    const messagesAfterCursor = await prisma.message.findMany({
      where: {
        createdAt: {
          gt: ltm_cursor,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to 20 messages
    });

    if (messagesAfterCursor.length < 20) {
      return;
    }

    const summarized = await summarizeMessages(user_token, messagesAfterCursor);
    if (summarized) {
      // update the cursor to the last message createdAt timestamp
      const lastMessage: any = messagesAfterCursor[0];
      await setPreference(
        "long_term_memory_cursor",
        lastMessage.createdAt.toString()
      );
    }
  } else {
    // get last 20 messages and summarize
    // this is the first time we are summarizing long term memory
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    if (messages.length < 20) {
      return;
    }

    const summarized = await summarizeMessages(user_token, messages);
    if (summarized) {
      const lastMessage: any = messages[0];
      await setPreference(
        "long_term_memory_cursor",
        lastMessage.createdAt.toString()
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
  const prisma = await getPrisma();

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
    logger.error(
      "Failed to get a valid response from the LLM for summarization."
    );
    return false;
  }

  await prisma.messageSummary.create({
    data: {
      id: `summary-${DateTime.now().toMillis()}`,
      summary: response.choices[0].message.content,
      firstMessageId: messages[messages.length - 1].id,
      lastMessageId: messages[0].id,
      createdAt: DateTime.now().toMillis(),
    },
  });

  // create memories in the database and vector
  create_memories({
    statements: final_statements,
    user_token: user_token,
  });

  return true;
}
