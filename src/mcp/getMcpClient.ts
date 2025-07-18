import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import logger from "../common/logger.js";
import getPrisma from "../db/prisma/client.js";

// Module-level cache for clients
const clientCache: Map<string, Client> = new Map();
// Track client initialization times
const clientInitTimes: Map<string, number> = new Map();
// Track last used times
const clientLastUsedTimes: Map<string, number> = new Map();
// Track transports per client for cleanup
const clientTransports: Map<string, StdioClientTransport> = new Map();

export default async function getMcpClient({
  name,
}: {
  name: string;
}): Promise<Client> {

  const prisma = await getPrisma();

  // Check cache first
  if (clientCache.has(name)) {
    // Update last used time when retrieving from cache
    clientLastUsedTimes.set(name, Date.now());
    return clientCache.get(name)!;
  }
  let client: Client | null = null; // Use the Client class from the SDK
  let transport: StdioClientTransport | null = null; // Declare transport for finally block

  try {
    const server = await prisma.mCPServer.findUnique({
      where: { name },
    });
    if (!server) {
      throw new Error(`Server with name "${name}" not found in servers`);
    }
    const env = server.envs as string[] || [];
    // Pass command and args separately to avoid accidental backslash issues
    transport = new StdioClientTransport({
      command: server.command, // Use the command from servers
      args: server.args as string[], // Use the args from servers
      cwd: process.cwd(), // default to current working directory
      //@ts-ignore
      env: {
        ...process.env, // Use the env from servers, default to empty object
        ...env, // Merge with server-specific environment variables
      },
    });

    transport.onerror = (error: Error) => {
      logger.error(
        `Transport error for MCP client '${name}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    };

    transport.onclose = () => {
      logger.info(`Transport for MCP client '${name}' closed.`);
      // Cleanup caches on transport close
      clientCache.delete(name);
      clientInitTimes.delete(name);
      clientLastUsedTimes.delete(name);
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
        `Failed to connect MCP client '${name}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new Error(
        `Failed to connect MCP client '${name}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    // Cache the client instance and transport
    clientCache.set(name, client);
    clientInitTimes.set(name, Date.now()); // Track when the client was initialized
    clientLastUsedTimes.set(name, Date.now()); // Track when the client was last used
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
    clientLastUsedTimes.delete(name);
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
    lastUsedMs: now - (clientLastUsedTimes.get(name) ?? now),
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
    clientLastUsedTimes.delete(name);
    clientTransports.delete(name);
    return true;
  }
  return false;
}
