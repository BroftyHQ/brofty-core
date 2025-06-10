import { AuthorizedGraphQLContext } from "../types/context.js";

export function withAuth(resolver: any) {
  return async function(parent: any, args: any, context: AuthorizedGraphQLContext, info: any) {
    if (!context.user.token) {
      throw new Error("User not authenticated");
    }
    return resolver(parent, args, context, info);
  };
}
