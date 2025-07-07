import { AuthorizedGraphQLContext } from "../types/context.js";
import { getPreference } from "../user_preferences/index.js";
import { syncTools } from "./mutations/syncTools.js";

export default async function authorized_user_initialization({
  user_token,
}: {
  user_token: string;
}): Promise<void> {
  const is_user_initialized = await getPreference(
    "is_authorized_user_initialized"
  );
  if (is_user_initialized) {
    return;
  }
  const ctx: AuthorizedGraphQLContext = { user: { token: user_token } };
  
  syncTools(null, null, ctx, null);
}
