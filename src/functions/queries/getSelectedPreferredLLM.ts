import { AuthorizedGraphQLContext } from "../../types/context.js";
import get_user_preferred_llm from "../llm/get_user_preferred_llm.js";

export async function getSelectedPreferredLLM(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const preferredLLM = await get_user_preferred_llm();
  return preferredLLM;
}
