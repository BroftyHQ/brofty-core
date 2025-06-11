import logger from "../common/logger.js";
import {
  get_available_tools,
  override_available_tools,
} from "../tools/available_tools_manager.js";
import getMcpClient from "./getMcpClient.js";

export default async function add_availble_mcp_tools(name: string, first_time = false) {
  let mcp = null;

  try {
    mcp=await getMcpClient({ name });
  }catch (error) {
    logger.error(`Failed to get MCP client for '${name}': ${error.message}`);
    if (first_time) {
      logger.info('Removing MCP server from available servers due to client error.');
      const serversJson = get_available_tools();
      if (serversJson[name]) {
        delete serversJson[name];
        override_available_tools(serversJson);
      }
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

  const toolsJson = get_available_tools();
  if (!toolsJson[name]) toolsJson[name] = [];
  toolsJson[name] = toolsJson[name].concat(tools);
  override_available_tools(toolsJson);
  logger.info(
    `Added available tools for MCP server '${name}': ${tools.length} tools.`
  );
}
