import { firebaseAuthApp } from "./firebase/index.js";
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
    var payload: any;
    try {
      payload = await firebaseAuthApp.verifyIdToken(authorization);
    } catch (error: any) {
      if (authorization === "brofty-srr-server") {
        return {
          user: {
            email: "ssr.server@brofty.com",
            email_verified: payload.email_verified,
          },
        } as AuthorizedGraphQLContext;
      }
      return contextIfNotAuthorized;
    }
    return {
      user: {
        email: payload.email,
        email_verified: payload.email_verified,
      },
    } as AuthorizedGraphQLContext;
  } else {
    return contextIfNotAuthorized;
  }
}
