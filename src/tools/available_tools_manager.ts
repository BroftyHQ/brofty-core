import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import rewrite_mcp_tools from '../mcp/servers_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toolsFilePath = path.join(__dirname, 'available_tools.json');
const defaultToolsFilePath = path.join(__dirname, 'default_tools.json');

function ensureToolsFileExists() {
  if (!fs.existsSync(toolsFilePath)) {
    if (fs.existsSync(defaultToolsFilePath)) {
      fs.copyFileSync(defaultToolsFilePath, toolsFilePath);
      rewrite_mcp_tools();
    } else {
      throw new Error('Neither available_tools.json nor default_tools.json found.');
    }
  }
}

/**
 * Reads and returns the parsed available tools JSON.
 */
export function get_available_tools(): any {
  try {
    ensureToolsFileExists();
    const data = fs.readFileSync(toolsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    throw new Error('Failed to read available_tools.json: ' + err);
  }
}

/**
 * Overrides the available tools JSON with the provided object.
 * @param newTools The new tools object to write.
 */
export function override_available_tools(newTools: any): void {
  try {
    ensureToolsFileExists();
    const json = JSON.stringify(newTools, null, 2);
    fs.writeFileSync(toolsFilePath, json, 'utf-8');
  } catch (err) {
    throw new Error('Failed to write available_tools.json: ' + err);
  }
}
