import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import logger from "../common/logger.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx", // Use system npx from PATH
    args: ["-y", "@tokenizin/mcp-npx-fetch"],
    env: {
      ...process.env
    },
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

    logger.info(await client.listTools());
    await client.close();
}

// Run the main function
main();
