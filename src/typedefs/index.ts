const typeDefs = `
  type Message {
    id: ID!
    text: String!
    by: String!
  }

  type Query {
    status: String!
    getMessages: [Message]
  }

  type Mutation {
    sendMessage(message: String!): Message
  }

  type PartialMessage {
    type: String!
    id: ID!
    text: String!
    by: String!
  }

  type Subscription {
    messageStream: PartialMessage
  }

`;

export default typeDefs;
