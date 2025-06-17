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
        `MESSAGE_STREAM`,
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
        `SYSTEM_STATUS`,
      ]);
    }),
  },
  systemLogs: {
    subscribe: withAuth(async (
      parent,
      args,
      context: AuthorizedGraphQLContext,
      info
    ) => {
      return pubsub.asyncIterableIterator([
        `SYSTEM_LOGS`,
      ]);
    }),
  },
};
