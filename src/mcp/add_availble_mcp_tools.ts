import { randomUUID } from "crypto";
import logger from "../common/logger.js";
import { syncTools } from "../functions/mutations/syncTools.js";
import { AuthorizedGraphQLContext } from "../types/context.js";
import getMcpClient from "./getMcpClient.js";
import { remove_availble_mcp_tools } from "./remove_availble_mcp_tools.js";
import getPrisma from "../db/prisma/client.js";

export default async function add_availble_mcp_tools({
  name,
  first_time = false,
  context,
}: {
  name: string;
  first_time: boolean;
  context: AuthorizedGraphQLContext;
}) {
  let mcp = null;
  const prisma = await getPrisma();

  try {
    mcp = await getMcpClient({ name });
  } catch (error) {
    logger.error(`Failed to get MCP client for '${name}': ${error.message}`);
    if (first_time) {
      logger.info(
        "Removing MCP server from available servers due to client error."
      );
      await remove_availble_mcp_tools(name);
    } else {
      return;
    }
  }
  if (!mcp) {
    logger.error(`MCP client for '${name}' not found.`);
    return;
  }
  const tools = (await mcp.listTools()).tools || [];
  if (!tools.length) {
    logger.warn(`No tools found for MCP server '${name}'.`);
    return;
  }

  for (const tool of tools) {
    await prisma.tool.upsert({
      where: {
        name_mcpServer: {
          name: tool.name,
          mcpServer: name,
        },
      },
      update: {
        name: tool.name,
        description: tool.description,
        defination: tool,
      },
      create: {
        id: randomUUID(),
        name: tool.name,
        description: tool.description,
        defination: tool,
        mcpServer: name,
      },
    });
  }
  logger.info(
    `Added available tools for MCP server '${name}': ${tools.length} tools.`
  );
  if (tools.length > 0) {
    syncTools(
      null,
      {
        mcp_server_name: name,
      },
      context,
      null
    );
  }
}
