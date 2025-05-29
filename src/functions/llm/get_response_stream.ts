import getOpenAIClient from "../../llms/openai.js";
import tools from "../../tools/index.js";

export default async function get_response_stream({
  input,
}: {
  input: string;
}) {
  const client = getOpenAIClient();
  return await client.responses.create({
    model: "gpt-4.1-mini-2025-04-14",
    tools: tools,
    tool_choice: "auto",
    input,
    stream: true,
  });
}
