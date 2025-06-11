const queries = `
type Query {
  status: String!
  getMessages: [Message]
  getPreferenceByKey(key: String!): String
  getLocalLLMStatus: LocalLLMStatus!
  getAvailableMCPServers: [MCPServer]
  getAvailableTools: [Tool]
}
`;
export default queries;
