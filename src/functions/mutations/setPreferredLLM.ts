import { setPreference } from "../../user_preferences/index.js";


// Sets the preferred LLM for the user
export async function setPreferredLLM(parent: any, args: { llmId: string }, context: any) {
  const { llmId } = args;
  if (!llmId) {
    throw new Error("llmId is required");
  }
  await setPreference("preferred_llm", llmId);
  return true;
}
