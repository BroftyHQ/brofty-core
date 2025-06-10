import logger from "../common/logger.js";
import { promises as fs } from "fs";
import path from "path";

export async function remove_availble_mcp_tools(name: string) {
    try {
        const toolsPath = path.resolve(process.cwd(), 'src/tools/available_tools.json');
        const toolsRaw = await fs.readFile(toolsPath, 'utf-8');
        const toolsJson = JSON.parse(toolsRaw);
        if (toolsJson[name]) {
            delete toolsJson[name];
            await fs.writeFile(toolsPath, JSON.stringify(toolsJson, null, 2), 'utf-8');
            logger.info(`Removed available tools for MCP server '${name}'.`);
        } else {
            logger.warn(`No available tools found for MCP server '${name}'.`);
        }
    } catch (error: any) {
        logger.error(`Error removing available tools for MCP server '${name}': ${error.message}`);
    }
}
