import { File } from "../../../prisma/generated/client.js";
import getPrisma from "../../db/prisma/client.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

const MAX_FILES = 50;

export async function getFiles(
  _parent: any,
  _args: { cursor?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  let files: File[] = [];
  const prisma = await getPrisma();
  
  if (_args.cursor) {
    files = await prisma.file.findMany({
      where: {
        createdAt: {
          lt: Number(_args.cursor),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: MAX_FILES,
    });
  } else {
    files = await prisma.file.findMany({
      take: MAX_FILES,
      orderBy: { createdAt: "desc" },
    });
  }

  return files.map((file) => {
    return {
      filename: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      size: Number(file.size), // Convert BIGINT to number for GraphQL Int type
      createdAt: file.createdAt.toString(), // Ensure createdAt is a string
    };
  });
}
