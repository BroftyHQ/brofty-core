import { mcp_server_model } from "../db/sqlite/models.js";
import add_availble_mcp_tools from "./add_availble_mcp_tools.js";

export default async function rewrite_mcp_tools() {
  // get all mcp installed from servers
  const mcp_installed = await mcp_server_model.findAll({});
  // for each mcp, get the tools
  for (const mcp of mcp_installed) {
    // rewrite the tools in the available tools manager
    await add_availble_mcp_tools(mcp.dataValues.name);
  }
}
