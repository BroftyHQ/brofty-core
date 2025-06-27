import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function getLocalLLMStatus(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  return {
    is_downloading: false,
    progress: "0",
    error: null,
    is_ready: false,
  };
}
