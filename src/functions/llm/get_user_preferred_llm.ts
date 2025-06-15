import { getPreference } from "../../user_preferences/index.js";

/**
 * Returns the user's preferred LLM model name, or a default if not set.
 */
export default async function get_user_preferred_llm(): Promise<string> {
  const preferred = await getPreference("preferred_llm");
  // Fallback to a default model if not set
  return preferred || "openai/gpt-4o-mini";
}
