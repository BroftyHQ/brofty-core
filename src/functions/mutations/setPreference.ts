import { AuthorizedGraphQLContext } from "../../types/context.js";
import { setPreference } from "../../user_preferences/index.js";

const ALLOWED_KEYS = [
  "theme",
];
export async function setPreferenceMutation(
  _parent: any,
  args: { key: string; value: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  if (!ALLOWED_KEYS.includes(args.key)) {
    throw new Error(`Invalid preference key: ${args.key}`);
  }
  await setPreference(args.key, args.value);
  return args.value;
}
