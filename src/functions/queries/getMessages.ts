import getPrisma from "../../db/prisma/client.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";
import authorized_user_initialization from "../authorized_user_initialization.js";

const MAX_MESSAGES = 25;

export async function getMessages(
  _parent: any,
  _args: { cursor?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  let messages: any[] = [];
  if (_args.cursor) {
    messages = await prisma.message.findMany({
      where: {
        createdAt: {
          lt: Number(_args.cursor),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_MESSAGES,
    });
  } else {
    messages = await prisma.message.findMany({
      take: MAX_MESSAGES,
      orderBy: { createdAt: "desc" },
    });

    if (messages.length === 0) {
      // this might be the first request from user
      // check user intialization
      authorized_user_initialization({
        user_token: context.user.token,
      });
    }
  }
  return messages.map((message) => {
    return {
      ...message,
      createdAt: message.createdAt.toString(),
      updatedAt: message.updatedAt.toString(),
    }
  });
}
