import { nanoid } from "nanoid";
import logger from "../common/logger.js";
import getOpenAIClient from "../llms/openai.js";
import { DateTime } from "luxon";
import { randomUUID } from "crypto";
import qdrant_client from "../db/qdrant/client.js";
import getPrisma from "../db/prisma/client.js";

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
  const prisma = await getPrisma();

  const client = await getOpenAIClient(user_token);
  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a memory extractor that reads messages and identifies important facts, preferences, goals, or personal context that I have explicitly shared. Your job is to create memory statements that can be stored for long-term use.
          Guidelines:
          Only write down statements that have some meaningful information.
          Do not include generic or vague statements.
          Do not include temporary or situational information.
          Only extract information that I have directly stated.
          You can group similar statements together.
          Memory statements can be a single sentence or a short paragraph.
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
      id: randomUUID(),
      content: m,
      index: "user",
      createdAt: DateTime.now().toMillis(),
    }));
    if (memories.length === 0) {
      // logger.info("No valid memories extracted from the response.");
      return false;
    }

    // Assuming memories_model is defined and ready to use
    await prisma.memories.createMany({
      data: memories,
    });

    // add memories to vector database
    const vectors:any = await client.embeddings.create({
      model: "na",
      input: memories.map((m) => {
        return {
          id: m.id,
          text: m.content,
        };
      }),
    });
    await qdrant_client.upsert("user", {
      points: vectors.embeddings.map((vector: any) => ({
        id: vector.id,
        vector: vector.embedding,
        payload: memories.find((m) => m.id === vector.id) || {},
      })),
    });
  } catch (error) {
    logger.error("Failed to parse memory response:", error);
    return false;
  }

  return true;
}
