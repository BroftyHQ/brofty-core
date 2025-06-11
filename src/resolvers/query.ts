import { AuthorizedGraphQLContext } from "../types/context.js";
import { getPreference } from "../user_preferences/index.js";
import { message_model } from "../db/sqlite/models.js";
import { withAuth } from "./withAuth.js";
import { get_available_tools } from "../tools/available_tools_manager.js";
import { get_available_servers } from "../mcp/servers_manager.js";
import { getInitializedClientsInfo } from "../mcp/getMcpClient.js";

export const Query = {
  status: () => {
    return "Server is running";
  },
  getMessages: withAuth(
    async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const messages = await message_model.findAll({
        limit: 100,
        order: [["created_at", "DESC"]],
      });
      return messages.map((message: any) => {
        return {
          id: message.id,
          text: message.text,
          by: message.by,
          created_at: message.created_at.toString(),
        };
      });
    }
  ),
  getPreferenceByKey: withAuth(
    async (
      _parent: any,
      args: { key: string },
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const preference = await getPreference(args.key);
      return preference || null;
    }
  ),
  getLocalLLMStatus: withAuth(
    async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      return {
        is_downloading: false,
        progress: "0",
        error: null,
        is_ready: false,
      };
    }
  ),
  getAvailableMCPServers: withAuth(
    async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const serversJson = get_available_servers();
      return Object.entries(serversJson.mcpServers || {}).map(
        ([name, config]) => {
          const c = config as any;
          return {
            name,
            command: c.command,
            args: c.args || [],
            env: c.env
              ? Object.entries(c.env).map(([k, v]) => `${k}=********`)
              : [],
          };
        }
      );
    }
  ),
  getRunningMCPServers: withAuth(
    async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const list = getInitializedClientsInfo();
      return list.map((client) => {
        return {
          name: client.name,
          running_for: client.runningForMs.toString(),
        };
      });
    }
  ),
  getAvailableTools: withAuth(
    async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const toolsJson = get_available_tools();
      // Aggregate all tools, tagging non-local ones with their key as mcp_server
      const allTools = Object.entries(toolsJson).flatMap(([key, tools]) => {
        if (key === "local") return tools as any[];
        return (tools as any[]).map((tool) => ({ ...tool, mcp_server: key }));
      });
      return allTools;
    }
  ),
};
