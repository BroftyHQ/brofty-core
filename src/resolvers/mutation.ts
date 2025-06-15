import { sendMessage } from "../functions/mutations/sendMessage.js";
import { setPreferenceMutation } from "../functions/mutations/setPreference.js";
import { addMCPServer } from "../functions/mutations/addMCPServer.js";
import { removeMCPServer } from "../functions/mutations/removeMCPServer.js";
import { withAuth } from "./withAuth.js";
import stopMCPServer from "../functions/mutations/stopMCPServer.js";
import { setPreferredLLM } from "../functions/mutations/setPreferredLLM.js";

export const Mutation = {
  sendMessage: withAuth(sendMessage),
  setPreference: withAuth(setPreferenceMutation),
  addMCPServer: withAuth(addMCPServer),
  removeMCPServer: withAuth(removeMCPServer),
  stopMCPServer: withAuth(stopMCPServer),
  setPreferredLLM: withAuth(setPreferredLLM)
};
