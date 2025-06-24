import qdrant_client from "../db/qdrant/client.js";
import client from "../db/qdrant/client.js";
import getOpenAIClient from "../llms/openai.js";

export default async function get_ltm({
  query,
  user_token,
}: {
  query: string;
  user_token: string;
}): Promise<
  {
    role: "system";
    content: string;
  }[]
> {
  const client = await getOpenAIClient(user_token);
  const embedded_query: any = await client.embeddings.create({
    model: "na",
    input: query,
  });

  const top_k = 10; // Number of top results to retrieve
  const search_result = await qdrant_client.search("user", {
    vector: embedded_query.embedding,
    limit: top_k,
    with_payload: true,
  });
  const memories = [];

  for (const result of search_result) {
    const memory = result.payload;
    if (memory && memory.content) {
      memories.push(memory.content);
    }
  }
  if (memories.length === 0) {
    return [];
  }

  return [
    {
      role: "system",
      content: `Here are some relevant memories from your long-term memory that might help you with your query:\n\n
    ${memories.join("\n\n")}`,
    },
  ];
}
