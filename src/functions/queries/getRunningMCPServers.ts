import { AuthorizedGraphQLContext } from "../../types/context.js";
import { getInitializedClientsInfo } from "../../mcp/getMcpClient.js";

export async function getRunningMCPServers(
  _parent: any,
  _args: any,
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const list = getInitializedClientsInfo();
  return list.map((client) => {
    return {
      name: client.name,
      running_for: client.runningForMs.toString(),
    };
  });
}
