import { nanoid } from "nanoid";
import logger from "../common/logger.js";
import getOpenAIClient from "../llms/openai.js";
import { DateTime } from "luxon";
import { memories_model } from "../db/sqlite/models.js";

export default async function createMemories({
  statements,
  user_token,
}: {
  statements: string[];
  user_token: string;
}): Promise<boolean> {
  if (!statements || statements.length === 0) {
    return false;
  }

  const client = await getOpenAIClient(user_token);
  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a memory extractor that reads user messages and identifies important facts, preferences, goals, or personal context the user has explicitly shared. Your job is to create clear and concise memory statements that can be stored for long-term use.
          Guidelines:
          Only extract information the user directly stated.
          Do not infer, assume, or hallucinate anything.
          If there are no meaningful facts to remember, return an empty array.
          Output must follow this JSON format: {"memory": ["memory statement 1","memory statement 2"]}

          `,
      },
      {
        role: "user",
        content: `User messages:\n\n ${statements.join("\n ")}`,
      },
    ],
    stream: false,
  });

  if (!response || !response.choices || response.choices.length === 0) {
    return false;
  }
  const content = response.choices[0].message.content;
  if (!content || content.trim() === "") {
    return false;
  }
  try {
    const parsed = JSON.parse(content);
    if (!parsed.memory || !Array.isArray(parsed.memory)) {
      logger.error("Invalid memory format:", parsed);
      return false;
    }
    const memories = parsed.memory.map((m: string, index: number) => ({
      id: `memory-${nanoid()}`,
      content: m,
      index: "user",
      created_at: DateTime.now().toMillis(),
    }));

    // Assuming memories_model is defined and ready to use
    await memories_model.bulkCreate(memories);
  } catch (error) {
    logger.error("Failed to parse memory response:", error);
    return false;
  }

  return true;
}
