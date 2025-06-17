import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import logger from "../common/logger.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "/root/.nvm/versions/node/v22.16.0/bin/npx", // Use the command from servers
    args: ["-y", "@tokenizin/mcp-npx-fetch"], // Use the args from servers
    env: {}, // Use the env from servers, default to empty object
  });
  const client = new Client({
    name: "brofty", // A name for your client
    version: "1.0.0", // A version for your client
  });
    try {
      await client.connect(transport); // Set the transport for the client
    } catch (error) {
      logger.error(
        `Failed to connect MCP client : ${error instanceof Error ? error.message : String(error)}`
      );
    }

    console.log(await client.listTools());
    await client.close();
}

// Run the main function
main();
