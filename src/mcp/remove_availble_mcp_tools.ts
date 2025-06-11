import logger from "../common/logger.js";
import {
  get_available_tools,
  override_available_tools,
} from "../tools/available_tools_manager.js";

export async function remove_availble_mcp_tools(name: string) {
  try {
    const toolsJson = get_available_tools();
    if (toolsJson[name]) {
      delete toolsJson[name];
      override_available_tools(toolsJson);
      logger.info(`Removed available tools for MCP server '${name}'.`);
    } else {
      logger.warn(`No available tools found for MCP server '${name}'.`);
    }
  } catch (error: any) {
    logger.error(
      `Error removing available tools for MCP server '${name}': ${error.message}`
    );
  }
}
