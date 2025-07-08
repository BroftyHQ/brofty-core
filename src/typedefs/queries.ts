const queries = `
type Query {
  status: String!
  getMessages(cursor: String): [Message]
  getPreferenceByKey(key: String!): String
  getLocalLLMStatus: LocalLLMStatus!

  getAvailableMCPServers: [MCPServer]
  getRunningMCPServers: [RunningMCPServer]

  getAvailableTools: [Tool]
  areToolsSynced: Boolean!
  getSelectedPreferredLLM: String

  getUserMemories: [UserMemory]
  getFiles(cursor: String): [MessageFile]
}
`;
export default queries;
