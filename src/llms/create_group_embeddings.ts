import getOpenAIClient from "./openai.js";

const MAX_INPUT_LENGTH = 8000; // Max input length for OpenAI embeddings

export default async function create_group_embeddings({
  user_token,
  embedding_inputs,
}: {
  user_token: string;
  embedding_inputs: {
    id: string;
    text: string;
  }[];
}): Promise<{
  embeddings: {
    id: string;
    embedding: number[];
  }[]; 
}> {
  const openaiClient = await getOpenAIClient(user_token);

  // strip the individual inputs to the maximum length
  // modify the array in place
  embedding_inputs = embedding_inputs.map(input => {
    if (input.text.length > MAX_INPUT_LENGTH) {
      return {
        id: input.id,
        text: input.text.slice(0, MAX_INPUT_LENGTH),
      };
    }
    return input;
  });

  const res: any = await openaiClient.embeddings.create({
    model: "brofty-001",
    // @ts-ignore
    input: embedding_inputs,
  });
  return res;
}
