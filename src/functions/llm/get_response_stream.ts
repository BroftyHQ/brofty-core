
import OpenAI from "openai";
import { OPENAI_KEY } from "../../common/constants.js";
import tools from "../../tools/index.js";

const client = new OpenAI({
  apiKey: OPENAI_KEY,
});

export default async function get_response_stream({
  input,
}: {
  input: string;
}) {
    return await client.responses.create({
      model: "gpt-4.1-mini-2025-04-14",
      tools: tools,
      tool_choice: "auto",
      input,
      stream:true
    });

//   return await ollama.chat({
//     model: "llama3.1",
//     messages: [
//       {
//         role: "user",
//         content: input,
//       },
//     ],
//     // tools:tools,
//     stream: true,
//   });
}
