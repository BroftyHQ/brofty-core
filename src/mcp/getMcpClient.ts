import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mcp_server_model } from "../db/sqlite/models.js";
import logger from "../common/logger.js";

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

  try {
    const server = await mcp_server_model.findOne({
      where: { name },
    });
    if (!server) {
      throw new Error(`Server with name "${name}" not found in servers`);
    }
    console.log({
      command: server.dataValues.command,
      args: server.dataValues.args,
      env: server.dataValues.envs || {},
    });
    
    // Pass command and args separately to avoid accidental backslash issues
    transport = new StdioClientTransport({
      command: server.dataValues.command, // Use the command from servers
      args: server.dataValues.args, // Use the args from servers
      env: server.dataValues.envs || {}, // Use the env from servers, default to empty object
      stderr: "inherit", // Inherit stderr to see errors in console
    });

    transport.onerror = (error: Error) => {
      logger.error(
        `Transport error for MCP client '${name}': ${error instanceof Error ? error.message : String(error)}`
      );
    };

    transport.onclose = () => {
      logger.info(`Transport for MCP client '${name}' closed.`);
      // Cleanup caches on transport close
      clientCache.delete(name);
      clientInitTimes.delete(name);
      clientTransports.delete(name);
    };

    client = new Client({
      name: "brofty", // A name for your client
      version: "1.0.0", // A version for your client
    });
    
    try {
      await client.connect(transport); // Set the transport for the client
    } catch (error) {
      logger.error(
        `Failed to connect MCP client '${name}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
    // Cache the client instance and transport
    clientCache.set(name, client);
    clientInitTimes.set(name, Date.now()); // Track when the client was initialized
    clientTransports.set(name, transport); // Track transport for cleanup
    // Return the connected client instance
    return client;
  } catch (err) {
    // Cleanup if client or transport was partially created
    if (client) {
      try {
        client.close();
      } catch {}
    }
    if (transport && typeof transport.close === "function") {
      try {
        await transport.close();
      } catch {}
    }
    // Remove from caches if present
    clientCache.delete(name);
    clientInitTimes.delete(name);
    clientTransports.delete(name);
    throw new Error(
      `Failed to launch or connect MCP client '${name}': ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
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
