import { Query } from "./query.js";
import { Mutation } from "./mutation.js";
import { Subscription } from "./subscription.js";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";

const resolvers = {
  Upload: GraphQLUpload,
  Query,
  Mutation,
  Subscription,
};

export default resolvers;
