const mutations = `
type Mutation {
  sendMessage(message: String!, files: [Upload!], webSearch: Boolean): Message
  setPreference(key: String!, value: String!): String
  addMCPServer(name: String!, command: String!, args: [String], env: String, description: String): MCPServer
  syncMCPServerTools(name: String!): Boolean!
  removeMCPServer(name: String!): Boolean
  stopMCPServer(name: String!): Boolean
  setPreferredLLM(llmId: String!): Boolean

  syncTools: Boolean!
  deleteMemory(id: String!): Boolean!
}
`;
export default mutations;
