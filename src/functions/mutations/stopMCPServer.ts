import { closeClient } from "../../mcp/getMcpClient.js";

export default async function stopMCPServer(parent, { name }, context) {
    closeClient(name);
    // wait 3s to ensure the server has stopped
    await new Promise(resolve => setTimeout(resolve, 3000));
    return true;
}