import logger from "../common/logger.js";
import {
  get_available_tools,
  override_available_tools,
} from "../tools/available_tools_manager.js";
import getMcpClient from "./getMcpClient.js";

export default async function add_availble_mcp_tools(name: string) {
  const mcp = await getMcpClient({ name });
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
