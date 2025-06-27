import { AuthorizedGraphQLContext } from "../../types/context.js";
import { getPreference } from "../../user_preferences/index.js";

export async function getPreferenceByKey(
  _parent: any,
  args: { key: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const preference = await getPreference(args.key);
  return preference || null;
}
