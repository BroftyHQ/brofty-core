import OpenAI from "openai";
import {
  calculate_expression,
  calculate_expression_def,
} from "./calculate_expression";

const tools: OpenAI.Responses.Tool[] = [calculate_expression_def];

export const toolMap = {
  calculate_expression,
};

export default tools;
