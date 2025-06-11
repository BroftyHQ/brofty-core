import { tools_model } from "../db/sqlite/models.js";

export async function remove_availble_mcp_tools(name: string) {
  await tools_model.destroy({
    where: { mcp_server: name },
  });
}
