import fs from 'fs';
import path from 'path';
import { mcp_server_model } from '../db/sqlite/models.js';

const serversPath = path.resolve(process.cwd(), 'src/mcp/servers.json');
const defaultServersPath = path.resolve(process.cwd(), 'src/mcp/default_servers.json');

function ensureServersFileExists() {
  if (!fs.existsSync(serversPath)) {
    if (fs.existsSync(defaultServersPath)) {
      fs.copyFileSync(defaultServersPath, serversPath);
    } else {
      throw new Error('Neither servers.json nor default_servers.json found.');
    }
  }
}

export async function get_available_servers() {
  return await mcp_server_model.findAll({}); 
}

export function override_servers(newServers: any) {
  ensureServersFileExists();
  const json = JSON.stringify(newServers, null, 2);
  fs.writeFileSync(serversPath, json, 'utf-8');
}
