const mutations = `
type Mutation {
  sendMessage(message: String!): Message
  setPreference(key: String!, value: String!): String
  addMCPServer(name: String!, command: String!, args: [String], env: [String]): MCPServer
  removeMCPServer(name: String!): Boolean
}
`;
export default mutations;
