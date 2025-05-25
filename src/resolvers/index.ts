import { nanoid } from "nanoid";
import { AuthorizedGraphQLContext } from "../types/context";
import { Message } from "../generated/prisma";
import pubsub from "../pubsub";
import prisma from "../db/prisma";
import generate_response from "../functions/llm/generate_response";

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
      });
      return messages.map((message) => {
        return {
          id: message.id,
          text: message.content,
          by: message.user === user.email ? "You" : message.user,
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
        },
      });
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "NEW_MESSAGE",
          by: "You",
          id: message.id,
          text: message.content,
        },
      });
      const response_id = nanoid();
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "NEW_MESSAGE",
          by: "AI",
          id: response_id,
          text: "",
        },
      });
      generate_response(response_id, message.content, user.email);
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
