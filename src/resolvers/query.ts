import { withAuth } from "./withAuth.js";
import { getMessages } from "../functions/queries/getMessages.js";
import { getPreferenceByKey } from "../functions/queries/getPreferenceByKey.js";
import { getLocalLLMStatus } from "../functions/queries/getLocalLLMStatus.js";
import { getAvailableMCPServers } from "../functions/queries/getAvailableMCPServers.js";
import { getRunningMCPServers } from "../functions/queries/getRunningMCPServers.js";
import { getAvailableTools } from "../functions/queries/getAvailableTools.js";
import { areToolsSynced } from "../functions/queries/areToolsSynced.js";
import { getSelectedPreferredLLM } from "../functions/queries/getSelectedPreferredLLM.js";
import { getUserMemories } from "../functions/queries/getUserMemories.js";

export const Query = {
  status: () => {
    return "Server is running";
  },
  getMessages: withAuth(getMessages),
  getPreferenceByKey: withAuth(getPreferenceByKey),
  getLocalLLMStatus: withAuth(getLocalLLMStatus),
  getAvailableMCPServers: withAuth(getAvailableMCPServers),
  getRunningMCPServers: withAuth(getRunningMCPServers),
  getAvailableTools: withAuth(getAvailableTools),
  areToolsSynced: withAuth(areToolsSynced),
  getSelectedPreferredLLM: withAuth(getSelectedPreferredLLM),
  getUserMemories: withAuth(getUserMemories),
};
