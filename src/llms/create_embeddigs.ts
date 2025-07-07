import getOpenAIClient from "./openai.js";

const MAX_INPUT_LENGTH = 8000; // Max input length for OpenAI embeddings

export default async function create_embeddings({
  user_token,
  embedding_input,
}: {
  user_token: string;
  embedding_input: string;
}): Promise<{
  embedding: number[];
}> {
  const openaiClient = await getOpenAIClient(user_token);

  // strip the input to the maximum length
  if (embedding_input.length > MAX_INPUT_LENGTH) {
    embedding_input = embedding_input.slice(0, MAX_INPUT_LENGTH);
  }

  const res: any = await openaiClient.embeddings.create({
    model: "brofty-001",
    input: embedding_input,
  });
  return res;
}
