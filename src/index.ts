import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import typeDefs from "./typedefs";
import resolvers from "./resolvers";
import {
  AnonymousGraphQLContext,
  AuthorizedGraphQLContext,
} from "./types/context";
import { firebaseAuthApp } from "./firebase";
import { PrismaClient } from "./generated/prisma";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const prisma = new PrismaClient();

const { url } = await startStandaloneServer(server as any, {
  listen: { port: 4000 },
  context: async ({ req }: { req: any }) => {
    const contextIfNotAuthorized: AnonymousGraphQLContext = {
      prisma,
    };

    if (req.body.operationName === "IntrospectionQuery") {
      return contextIfNotAuthorized;
    }

    const authorization = req.headers.authorization;
    if (authorization) {
      var payload: any;
      try {
        payload = await firebaseAuthApp.verifyIdToken(authorization);
      } catch (error: any) {
        if (authorization === "brofty-srr-server") {
          return {
            user: {
              email: "ssr.server@brofty.com",
              email_verified: payload.email_verified,
            },
            prisma,
          } as AuthorizedGraphQLContext;
        }
        return contextIfNotAuthorized;
      }
      return {
        user: {
          email: payload.email,
          email_verified: payload.email_verified,
        },
        prisma,
      } as AuthorizedGraphQLContext;
    } else {
      return contextIfNotAuthorized;
    }
  },
});

console.log(`🚀 Server ready at: ${url}`);
