import OpenAI from "openai";
import {
  calculate_expression,
  calculate_expression_def,
} from "./calculate_expression";
import { http_client, http_client_def } from "./http_client";

const tools: OpenAI.Responses.Tool[] = [
  calculate_expression_def,
  // http_client_def,
];

export const toolMap = {
  calculate_expression,
  // http_client,
};

export default tools;
