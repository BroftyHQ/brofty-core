import pubsub from "../pubsub/index.js";
import { AuthorizedGraphQLContext } from "../types/context.js";
import { withAuth } from "./withAuth.js";

export const Subscription = {
  messageStream: {
    subscribe: withAuth(async (
      parent,
      args,
      context: AuthorizedGraphQLContext,
      info
    ) => {
      return pubsub.asyncIterableIterator([
        `MESSGAE_STREAM:${context.user.token}`,
      ]);
    }),
  },
  systemStatus: {
    subscribe: withAuth(async (
      parent,
      args,
      context: AuthorizedGraphQLContext,
      info
    ) => {
      return pubsub.asyncIterableIterator([
        `SYSTEM_STATUS:${context.user.token}`,
      ]);
    }),
  },
};
