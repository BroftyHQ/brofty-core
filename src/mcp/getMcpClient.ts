import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import servers from "./servers.json" with { type: "json" };

export default async function getMcpClient({
  name,
}: {
  name: string;
}): Promise<Client> {
  let client: Client | null = null; // Use the Client class from the SDK
  let transport: StdioClientTransport | null = null; // Declare transport for finally block

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
  // Return the connected client instance
  return client;
}
