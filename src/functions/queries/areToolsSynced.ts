import { AuthorizedGraphQLContext } from "../../types/context.js";
import qdrant_client from "../../db/qdrant/client.js";
import getPrisma from "../../db/prisma/client.js";

export async function areToolsSynced(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  // check is all tools in the database are in the qdrant collection
  const tools:any = await prisma.tool.findMany({
    select: { id: true },
  });
  const tool_ids = tools.map((tool) => tool.id);
  
  const qdrantTools = await qdrant_client.retrieve("tools", {
    ids: tool_ids,
    with_payload: false,
  });
  
  return qdrantTools.length === tool_ids.length;
}
