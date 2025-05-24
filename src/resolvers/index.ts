import { nanoid } from "nanoid";
import { AuthorizedGraphQLContext } from "../types/context";
import { Message } from "../generated/prisma";

const resolvers = {
  Query: {
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
      const messages: Message[] = await context.prisma.message.findMany({
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
      const message = await context.prisma.message.create({
        data: {
          id: nanoid(),
          content: args.message,
          createdAt: +new Date(),
          updatedAt: +new Date(),
          user: user.email,
        },
      });
      return message;
    },
  },
};

export default resolvers;
