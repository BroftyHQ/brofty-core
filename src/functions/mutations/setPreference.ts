import { AuthorizedGraphQLContext } from "../../types/context.js";
import { setPreference } from "../../user_preferences/index.js";

export async function setPreferenceMutation(
  _parent: any,
  args: { key: string; value: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  await setPreference(args.key, args.value);
  return args.value;
}
