import {
  AnonymousGraphQLContext,
  AuthorizedGraphQLContext,
} from "./types/context.js";

export default async function get_ctx_with_auth_token(
  token: string
): Promise<AnonymousGraphQLContext | AuthorizedGraphQLContext> {
  const contextIfNotAuthorized: AnonymousGraphQLContext = {};

  const authorization = token;
  if (authorization) {
    return {
      user: {
        token: authorization,
      },
    } as AuthorizedGraphQLContext;
  } else {
    return contextIfNotAuthorized;
  }
}
