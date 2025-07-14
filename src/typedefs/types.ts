const types = `
scalar Upload

type Message {
  id: ID!
  text: String!
  by: String!
  files: [MessageFile]
  createdAt: String!
}

type MessageFile {
  filename: String!
  mimetype: String!
  path: String!
  size: Int!
  createdAt: String!
}

type LocalLLMStatus {
  isDownloading: Boolean!
  progress: String
  error: String
  isReady: Boolean!
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
  runningFor: String!
  lastUsed: String!
}

type PartialMessage {
  type: String!
  id: ID!
  text: String!
  by: String!
  files: [MessageFile]
  createdAt: String!
}

type SystemStatus {
  cpuUsage: Float
  memoryUsage: Float
  diskUsage: Float
}

type Tool {
  name: String!
  description: String!
  mcpServer: String
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
  createdAt: String!
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
