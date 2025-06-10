const queries = `
type Query {
  status: String!
  getMessages: [Message]
  getPreferenceByKey(key: String!): String
  getLocalLLMStatus: LocalLLMStatus!
  getAvailableMCPServers: [MCPServer]
}
`;
export default queries;
