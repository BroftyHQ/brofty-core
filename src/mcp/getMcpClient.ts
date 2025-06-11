import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { get_available_servers } from "./servers_manager.js";

// Module-level cache for clients
const clientCache: Map<string, Client> = new Map();
// Track client initialization times
const clientInitTimes: Map<string, number> = new Map();
// Track transports per client for cleanup
const clientTransports: Map<string, StdioClientTransport> = new Map();

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

  const servers = get_available_servers();

  const server = servers["mcpServers"][name];
  if (!server) {
    throw new Error(`Server with name "${name}" not found in servers`);
  }
  // Pass command and args separately to avoid accidental backslash issues
  transport = new StdioClientTransport({
    command: server.command, // Use the command from servers
    args: server.args, // Use the args from servers
    env: server.env || {}, // Use the env from servers, default to empty object
  });

  client = new Client({
    name: "brofty", // A name for your client
    version: "1.0.0", // A version for your client
  });
  client.connect(transport); // Set the transport for the client
  // Cache the client instance and transport
  clientCache.set(name, client);
  clientInitTimes.set(name, Date.now()); // Track when the client was initialized
  clientTransports.set(name, transport); // Track transport for cleanup
  // Return the connected client instance
  return client;
}

// Exported utility to get info about initialized clients
export function getInitializedClientsInfo() {
  const now = Date.now();
  return Array.from(clientCache.entries()).map(([name, client]) => ({
    name,
    runningForMs: now - (clientInitTimes.get(name) ?? now),
  }));
}

// Exported utility to close a client and remove from cache
export async function closeClient(name: string) {
  const client = clientCache.get(name);
  const transport = clientTransports.get(name);
  if (client) {
    if (transport && typeof transport.close === "function") {
      try {
        client.close(); // Close the client connection
        // Close the transport if it has a close method
        await transport.close();
      } catch (e) {
        // Ignore errors on close
      }
    }
    clientCache.delete(name);
    clientInitTimes.delete(name);
    clientTransports.delete(name);
    return true;
  }
  return false;
}
