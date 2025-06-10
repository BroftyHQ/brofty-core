import getMcpClient from "./getMcpClient.js";

async function main() {
    const fetch_mcp_server = await getMcpClient({ name: "notionApi" });
    console.log("Available tools in fetch_mcp_server:");

    // List all available methods in the fetch_mcp_server
    console.log(await fetch_mcp_server.listTools());
    
}

// Run the main function
main();
