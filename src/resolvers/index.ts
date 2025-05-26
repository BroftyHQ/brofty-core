import { nanoid } from "nanoid";
import { AuthorizedGraphQLContext } from "../types/context";
import { Message } from "../generated/prisma";
import pubsub from "../pubsub";
import prisma from "../db/prisma";
import generate_response from "../functions/llm/generate_response";
import add_to_recent_messages from "../cache/add_to_recent_messages";

const resolvers = {
  Query: {
    status: () => {
      return "Server is running";
    },
    getMessages: async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const user = context.user;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const messages: Message[] = await prisma.message.findMany({
        where: {
          user: user.email,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });
      return messages.map((message) => {
        return {
          id: message.id,
          text: message.content,
          by: message.by,
          created_at: (message.createdAt).toString(),
        };
      });
    },
  },
  Mutation: {
    sendMessage: async (
      _parent: any,
      args: { message: string },
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const user = context.user;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const message = await prisma.message.create({
        data: {
          id: nanoid(),
          content: args.message,
          createdAt: +new Date(),
          updatedAt: +new Date(),
          user: user.email,
          by:"You"
        },
      });
      await add_to_recent_messages({
        user: user.email,
        by: "User",
        content: message.content,
      })
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "NEW_MESSAGE",
          by: "You",
          id: message.id,
          text: message.content,
          created_at: (message.createdAt).toString(),
        },
      });
      const response_id = nanoid();
      const initial_response_time = +new Date();
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "NEW_MESSAGE",
          by: "AI",
          id: response_id,
          text: "",
          created_at: initial_response_time.toString(),
        },
      });
      generate_response(response_id,initial_response_time, user.email);
      return message;
    },
  },
  Subscription: {
    messageStream: {
      subscribe: () => pubsub.asyncIterableIterator(["MESSGAE_STREAM"]),
    },
  },
};

export default resolvers;
