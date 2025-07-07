const types = `
scalar Upload

type Message {
  id: ID!
  text: String!
  by: String!
  files: [MessageFile]
  created_at: String!
}

type MessageFile {
  filename: String!
  mimetype: String!
  path: String!
  size: Int!
}

type LocalLLMStatus {
  is_downloading: Boolean!
  progress: String
  error: String
  is_ready: Boolean!
}

type MCPServer {
  name: String!
  description: String
  command: String!
  args: [String]
  env: String
}

type RunningMCPServer {
  name: String!
  running_for: String!
}

type PartialMessage {
  type: String!
  id: ID!
  text: String!
  by: String!
  files: [MessageFile]
  created_at: String!
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

type SystemLog {
  type: String!
  message: String!
  timestamp: String!
}

type UserMemory {
  id: ID!
  content: String!
  index: String!
  created_at: String!
}

type File {
  id: ID!
  filename: String!
  mimetype: String!
  encoding: String!
  size: Int!
  createdAt: String!
  updatedAt: String!
}
`;
export default types;
