import logger from "../../common/logger.js";
import getPrisma from "../../db/prisma/client.js";
import add_availble_mcp_tools from "../../mcp/add_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function addMCPServer(
  _parent: any,
  args: {
    name: string;
    command: string;
    args?: string[];
    env?: string;
    description?: string;
  },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const prisma = await getPrisma();
  // if description is provided, ensure it is not longer than 200 characters
  if (args.description && args.description.length > 200) {
    throw new Error("Description must be 200 characters or less");
  }

  // do not support spaces in name replace them with hyphens
  if (args.name.includes(" ")) {
    logger.warn("MCP Server name contains spaces, replacing with hyphens");
    args.name = args.name.replace(/\s+/g, "-");
  }

  // if args.env is a string, parse it as JSON and validate it as valid key value pairs
  let envArray: string[] = [];
  if (typeof args.env === "string") {
    try {
      const parsed = JSON.parse(args.env);
      if (Array.isArray(parsed)) {
        envArray = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        // If env is an object, convert to array of key=value strings
        envArray = Object.entries(parsed).map(([k, v]) => `${k}=${v}`);
      } else {
        throw new Error("env must be a JSON array or object");
      }
    } catch (error) {
      throw new Error("Invalid JSON string for env");
    }
  }

  const serverExists = await prisma.mCPServer.findUnique({
    where: { name: args.name },
  });
  if (!serverExists) {
    // If the server does not exist, we can add it
    await prisma.mCPServer.create({
      data: {
        name: args.name,
        description: args.description,
        command: args.command,
        args: args.args || [],
        envs: args.env ? JSON.parse(args.env) : {},
        status: "stopped", // Default status
      },
    });
  }
  add_availble_mcp_tools({ name: args.name, first_time: true, context });

  return {
    name: args.name,
    description: args.description,
    command: args.command,
    args: args.args || [],
    env: envArray.toString(),
  };
}
