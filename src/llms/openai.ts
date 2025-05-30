import OpenAI from "openai";
import { getPreference } from "../user_preferences/index.js";

let cachedKey: string | undefined;
let cachedClient: OpenAI | undefined;

function getOpenAIClient() {
  const currentKey = getPreference("OPENAI_KEY");
  if (!currentKey) {
    throw new Error("OpenAI API key is not set in user preferences.");
  }
  if (!cachedClient || cachedKey !== currentKey) {
    cachedClient = new OpenAI({ apiKey: currentKey });
    cachedKey = currentKey;
  }
  return cachedClient;
}

export default getOpenAIClient;
