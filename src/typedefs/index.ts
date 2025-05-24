const typeDefs = `
  type Message {
    id: ID!
    text: String!
    by: String!
  }

  type Query {
    getMessages: [Message]
  }

  type Mutation {
    sendMessage(message: String!): Message
  }
`;

export default typeDefs;
