const mutations = `
type Mutation {
  sendMessage(message: String!): Message
  setPreference(key: String!, value: String!): String
  addMCPServer(name: String!, command: String!, args: [String], env: String): MCPServer
  syncMCPServerTools(name: String!): Boolean!
  removeMCPServer(name: String!): Boolean
  stopMCPServer(name: String!): Boolean
  setPreferredLLM(llmId: String!): Boolean

  syncTools: Boolean!
  deleteMemory(id: String!): Boolean!
}
`;
export default mutations;
