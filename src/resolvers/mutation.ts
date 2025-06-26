import { sendMessage } from "../functions/mutations/sendMessage.js";
import { setPreferenceMutation } from "../functions/mutations/setPreference.js";
import { addMCPServer } from "../functions/mutations/addMCPServer.js";
import { removeMCPServer } from "../functions/mutations/removeMCPServer.js";
import { withAuth } from "./withAuth.js";
import stopMCPServer from "../functions/mutations/stopMCPServer.js";
import { setPreferredLLM } from "../functions/mutations/setPreferredLLM.js";
import { syncMCPServerTools } from "../functions/mutations/syncMCPServerTools.js";
import { deleteMemory } from "../functions/mutations/deleteMemory.js";
import { syncTools } from "../functions/mutations/syncTools.js";

export const Mutation = {
  sendMessage: withAuth(sendMessage),
  setPreference: withAuth(setPreferenceMutation),
  addMCPServer: withAuth(addMCPServer),
  syncMCPServerTools: withAuth(syncMCPServerTools),
  removeMCPServer: withAuth(removeMCPServer),
  stopMCPServer: withAuth(stopMCPServer),
  setPreferredLLM: withAuth(setPreferredLLM),
  syncTools: withAuth(syncTools),
  deleteMemory: withAuth(deleteMemory)
};
