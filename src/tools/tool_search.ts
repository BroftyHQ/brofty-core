import OpenAI from "openai";
import qdrant_client from "../db/qdrant/client.js";
import getOpenAIClient from "../llms/openai.js";

export default async function tool_search({
  user_token,
  query,
}: {
  user_token: string;
  query: string;
}) {
  const openaiClient = await getOpenAIClient(user_token);
  const response: any = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  if (!response || !response.embedding) {
    throw new Error("Failed to generate embedding for the query.");
  }
  const relevant_tools = await qdrant_client.search("tools", {
    vector: response.embedding,
    with_payload: true,
    limit: 10,
  });
  const tool_names = relevant_tools.map((tool) => tool.payload.name);
  return tool_names;
}
