import pubsub from "../pubsub/index.js";
import { AuthorizedGraphQLContext } from "../types/context.js";
import { withAuth } from "./withAuth.js";
import { getLastLogs } from "../libs/pm2.js";

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
      // Send last 25 logs immediately on connect
      const logs = getLastLogs();
      setTimeout(() => {
        logs.forEach(log => {
          pubsub.publish("SYSTEM_LOGS", { systemLogs: log });
        });
      }, 250); // Small delay to ensure subscription is ready

      // Start streaming new logs
      return pubsub.asyncIterableIterator([
        `SYSTEM_LOGS`,
      ]);
    }),
  },
};
