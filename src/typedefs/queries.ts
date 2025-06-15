const queries = `
type Query {
  status: String!
  getMessages: [Message]
  getPreferenceByKey(key: String!): String
  getLocalLLMStatus: LocalLLMStatus!
  getAvailableMCPServers: [MCPServer]
  getRunningMCPServers: [RunningMCPServer]
  getAvailableTools: [Tool]
  getSelectedPreferredLLM: String
}
`;
export default queries;
