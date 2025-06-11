const types = `
type Message {
  id: ID!
  text: String!
  by: String!
  created_at: String!
}

type LocalLLMStatus {
  is_downloading: Boolean!
  progress: String
  error: String
  is_ready: Boolean!
}

type MCPServer {
  name: String!
  command: String!
  args: [String]
  env: [String]
}

type PartialMessage {
  type: String!
  id: ID!
  text: String!
  by: String!
  created_at: String
}

type SystemStatus {
  cpu_usage: Float
  memory_usage: Float
  disk_usage: Float
}

type Tool {
  name: String!
  description: String!
  mcp_server: String
}
`;
export default types;
