import logger from "../common/logger.js";
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
    
    // write tools to mcp/available_tools.json
    const fs = await import('fs/promises');
    const path = await import('path');
    const toolsPath = path.resolve(process.cwd(), 'src/tools/available_tools.json');
    const toolsRaw = await fs.readFile(toolsPath, 'utf-8');
    const toolsJson = JSON.parse(toolsRaw);
    if (!toolsJson[name]) toolsJson[name] = [];
    toolsJson[name] = toolsJson[name].concat(tools);
    await fs.writeFile(toolsPath, JSON.stringify(toolsJson, null, 2), 'utf-8');
    logger.info(`Added available tools for MCP server '${name}': ${tools.length} tools.`);

}