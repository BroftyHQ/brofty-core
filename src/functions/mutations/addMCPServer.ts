import logger from "../../common/logger.js";
import { mcp_server_model } from "../../db/sqlite/models.js";
import add_availble_mcp_tools from "../../mcp/add_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function addMCPServer(
  _parent: any,
  args: { name: string; command: string; args?: string[]; env?: string, description?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
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

  mcp_server_model
    .findOrCreate({
      where: { name: args.name },
      defaults: {
        name: args.name,
        description: args.description,
        command: args.command,
        args: args.args || [],
        envs: args.env ? JSON.parse(args.env) : {},
        status: "stopped", // Default status
      },
    })
    .then(([server, created]) => {
      if (created) {
        add_availble_mcp_tools({ name: args.name, first_time: true, context });
      }
    })
    .catch((error) => {
      console.error("Error adding MCP server:", error);
      throw new Error(`Failed to add MCP server: ${error.message}`);
    });

  return {
    name: args.name,
    description: args.description,
    command: args.command,
    args: args.args || [],
    env: envArray.toString(),
  };
}
