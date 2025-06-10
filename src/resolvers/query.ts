import { AuthorizedGraphQLContext } from "../types/context.js";
import { getPreference } from "../user_preferences/index.js";
import { message_model } from "../db/sqlite/models.js";
import { withAuth } from "./withAuth.js";

export const Query = {
  status: () => {
    return "Server is running";
  },
  getMessages: withAuth(async (
    _parent: any,
    _args: any,
    context: AuthorizedGraphQLContext,
    _info: any
  ) => {
    const messages = await message_model.findAll({
      limit: 100,
    });
    return messages.map((message: any) => {
      return {
        id: message.id,
        text: message.text,
        by: message.by,
        created_at: message.created_at.toString(),
      };
    });
  }),
  getPreferenceByKey: withAuth(async (
    _parent: any,
    args: { key: string },
    context: AuthorizedGraphQLContext,
    _info: any
  ) => {
    const preference = await getPreference(args.key);
    return preference || null;
  }),
  getLocalLLMStatus: withAuth(async (
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
  }),
  getAvailableMCPServers: withAuth(async (
    _parent: any,
    _args: any,
    context: AuthorizedGraphQLContext,
    _info: any
  ) => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const serversPath = path.resolve(process.cwd(), "src/mcp/servers.json");
    const serversRaw = await fs.readFile(serversPath, "utf-8");
    const serversJson = JSON.parse(serversRaw);
    return Object.entries(serversJson.mcpServers || {}).map(([name, config]) => {
      const c = config as any;
      return {
        name,
        command: c.command,
        args: c.args || [],
        env: c.env ? Object.entries(c.env).map(([k, v]) => `${k}=********`) : [],
      };
    });
  })
};
