import getOpenAIClient from "../../llms/openai.js";
import get_openai_tool_schema from "../../tools/get_openai_tool_schema.js";

(async () => {
  const tools = await get_openai_tool_schema();
  console.log(JSON.stringify(tools, null, 2));
  
  const client = getOpenAIClient();

  const res = await client.responses.create({
    model: "gpt-4.1-mini-2025-04-14",
    tools: tools,
    tool_choice: "auto",
    input: "What is the capital of France?",
  });
  console.log("Response:", res);
})();
