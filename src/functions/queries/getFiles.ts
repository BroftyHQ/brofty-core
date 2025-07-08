import { AuthorizedGraphQLContext } from "../../types/context.js";
import { files_model } from "../../db/sqlite/models.js";
import { Op } from "sequelize";

const MAX_FILES = 50;

export async function getFiles(
  _parent: any,
  _args: { cursor?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  let files: any[] = [];
  
  if (_args.cursor) {
    files = await files_model.findAll({
      where: {
        created_at: {
          [Op.lt]: Number(_args.cursor),
        },
      },
      order: [["created_at", "DESC"]],
      limit: MAX_FILES,
    });
  } else {
    files = await files_model.findAll({
      limit: MAX_FILES,
      order: [["created_at", "DESC"]],
    });
  }

  return files.map((file: any) => {
    return {
      filename: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      size: Number(file.size), // Convert BIGINT to number for GraphQL Int type
      created_at: file.created_at.toString(), // Ensure created_at is a string
    };
  });
}
