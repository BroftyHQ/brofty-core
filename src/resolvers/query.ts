import { AuthorizedGraphQLContext } from "../types/context.js";
import { getPreference } from "../user_preferences/index.js";
import { mcp_server_model, message_model, tools_model } from "../db/sqlite/models.js";
import { withAuth } from "./withAuth.js";
import { getInitializedClientsInfo } from "../mcp/getMcpClient.js";
import get_user_preferred_llm from "../functions/llm/get_user_preferred_llm.js";

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
      return await mcp_server_model.findAll();
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
      const tools = await tools_model.findAll({});
      return tools;
    }
  ),
  getSelectedPreferredLLM: withAuth(
    async (
      _parent: any,
      _args: any,
      context: AuthorizedGraphQLContext,
      _info: any
    ) => {
      const preferredLLM = await get_user_preferred_llm();

      return preferredLLM;
    }
  ),
};
