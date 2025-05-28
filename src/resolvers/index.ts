import { nanoid } from "nanoid";
import { AuthorizedGraphQLContext } from "../types/context.js";
import pubsub from "../pubsub/index.js";
import generate_response from "../functions/llm/generate_response.js";
import add_to_recent_messages from "../cache/add_to_recent_messages.js";
import prisma from "../db/prisma.js";

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
      const messages = await prisma.message.findMany({
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
          created_at: message.createdAt.toString(),
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
          by: "You",
        },
      });
      await add_to_recent_messages({
        user: user.email,
        by: "User",
        content: message.content,
      });
      pubsub.publish(`MESSGAE_STREAM:${user.email}`, {
        messageStream: {
          type: "NEW_MESSAGE",
          by: "You",
          id: message.id,
          text: message.content,
          created_at: message.createdAt.toString(),
        },
      });
      const response = await prisma.message.create({
      data: {
        id : nanoid(),
        content: "",
        createdAt: +new Date(),
        updatedAt: +new Date(),
        user: user.email,
        by: "AI",
      },
    });
      pubsub.publish(`MESSGAE_STREAM:${user.email}`, {
        messageStream: {
          type: "NEW_MESSAGE",
          by: "AI",
          id: response.id,
          text: "",
          created_at: response.createdAt.toString(),
        },
      });
      generate_response(response.id, response.createdAt.toString(), user.email, '', 0);
      return message;
    },
  },
  Subscription: {
    messageStream: {
      subscribe: async (
        parent,
        args,
        context: AuthorizedGraphQLContext,
        info
      ) => {
        return pubsub.asyncIterableIterator([`MESSGAE_STREAM:${context.user.email}`]);
      },
    },
  },
};

export default resolvers;
