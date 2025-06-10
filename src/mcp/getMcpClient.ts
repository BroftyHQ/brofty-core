import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Module-level cache for clients
const clientCache: Map<string, Client> = new Map();

export default async function getMcpClient({
  name,
}: {
  name: string;
}): Promise<Client> {
  // Check cache first
  if (clientCache.has(name)) {
    return clientCache.get(name)!;
  }
  let client: Client | null = null; // Use the Client class from the SDK
  let transport: StdioClientTransport | null = null; // Declare transport for finally block

  // Import the servers.json file
  const fs = await import("fs/promises");
  const path = await import("path");
  const serversPath = path.resolve(process.cwd(), "src/mcp/servers.json");
  const serversRaw = await fs.readFile(serversPath, "utf-8");
  const servers = JSON.parse(serversRaw);

  const server = servers["mcpServers"][name];
  if (!server) {
    throw new Error(`Server with name "${name}" not found in servers.json`);
  }
  // Pass command and args separately to avoid accidental backslash issues
  transport = new StdioClientTransport({
    command: server.command, // Use the command from servers.json
    args: server.args, // Use the args from servers.json
    env: server.env || {}, // Use the env from servers.json, default to empty object
  });

  client = new Client({
    name: "brofty", // A name for your client
    version: "1.0.0", // A version for your client
  });
  client.connect(transport); // Set the transport for the client
  // Cache the client instance
  clientCache.set(name, client);
  // Return the connected client instance
  return client;
}
