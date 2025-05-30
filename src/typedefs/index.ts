const typeDefs = `
  type Message {
    id: ID!
    text: String!
    by: String!
    created_at: String!
  }

  type Query {
    status: String!
    getMessages: [Message]
    getPreferenceByKey(key: String!): String
  }

  type Mutation {
    sendMessage(message: String!): Message
    setPreference(key: String!, value: String!): String
  }

  type PartialMessage {
    type: String!
    id: ID!
    text: String!
    by: String!
    created_at: String
  }

  type Subscription {
    messageStream: PartialMessage
  }

`;

export default typeDefs;
