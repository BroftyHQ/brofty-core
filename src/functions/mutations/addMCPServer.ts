import logger from "../../common/logger.js";
import { mcp_server_model } from "../../db/sqlite/models.js";
import add_availble_mcp_tools from "../../mcp/add_availble_mcp_tools.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";

export async function addMCPServer(
  _parent: any,
  args: { name: string; command: string; args?: string[]; env?: string },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  // if args.env is a string, parse it as JSON and validate it as valid key value pairs
  if (typeof args.env === "string") {
    try {
      args.env = JSON.parse(args.env);
    } catch (error) {
      throw new Error("Invalid JSON string for env");
    }
  }

  mcp_server_model
    .findOrCreate({
      where: { name: args.name },
      defaults: {
        name: args.name,
        command: args.command,
        args: args.args || [],
        envs: args.env ? JSON.parse(args.env) : {},
        status: "stopped", // Default status
      },
    })
    .then(([server, created]) => {
      if (created) {
        add_availble_mcp_tools(args.name, true);
      }
    })
    .catch((error) => {
      console.error("Error adding MCP server:", error);
      throw new Error(`Failed to add MCP server: ${error.message}`);
    });

  return {
    name: args.name,
    command: args.command,
    args: args.args || [],
    env: args.env || [],
  };
}
