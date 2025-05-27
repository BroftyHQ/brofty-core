import { evaluate } from "mathjs";
import OpenAI from "openai";

async function calculate_expression({ expression }: { expression: string }) {
  try {
    const result = evaluate(expression);
    return { result: result.toString() };
  } catch (err: any) {
    return { result: `Error: ${err.message}` };
  }
}

const calculate_expression_def:OpenAI.Responses.Tool = {
  type: "function",
  name: "calculate_expression",
  description: "Evaluate a math expression and return the result.",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Math.js-compatible expression. E.g. 'sqrt(25 + 5^2)'",
      },
    },
    required: ["expression"],
    additionalProperties: false,
  },
  strict: true,
};

export {
  calculate_expression,
  calculate_expression_def
}