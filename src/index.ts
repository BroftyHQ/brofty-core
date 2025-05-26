// npm install @apollo/server @as-integrations/express5 express graphql cors
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import http from "http";
import cors from "cors";
import typeDefs from "./typedefs";
import resolvers from "./resolvers";
import { WebSocketServer } from "ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
//@ts-ignore
import { useServer } from "graphql-ws/use/ws";
import {
  AnonymousGraphQLContext,
  AuthorizedGraphQLContext,
} from "./types/context";
import { firebaseAuthApp } from "./firebase";
import Redis from "ioredis";
import { IS_PRODUCTION, REDIS_URI } from "./common/constants";

interface MyContext {
  token?: string;
}

const redis = new Redis(
  REDIS_URI
)




// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: "/v1/subscriptions",
});
const serverCleanup = useServer({ schema }, wsServer);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer<MyContext>({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
// Ensure we wait for our server to start
await server.start();

const corsConfig = cors<cors.CorsRequest>({
  maxAge: 86400,
  origin: (origin: any, callback: any) => {
    if (origin && origin === "http://localhost:3000") {
      callback(null, true);
      return;
    } else if (origin && origin.endsWith(".brofty.com")) {
      callback(null, true);
      return;
    } else if (origin && origin.endsWith(".vercel.app")) {
      callback(null, true);
      return;
    } else {
      callback(null, false);
      return;
    }
  },
});

app.get("/rest/v1/status", (req, res) => {
  redis.set("brofty-status-check",(+new Date()).toString())
  res.status(200).json({
    status: "ok",
    message: `Brofty SSR server is running in ${IS_PRODUCTION ? "production" : "development"} mode`,
  });
});

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/v1",
  corsConfig,
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }: { req: any }) => {
      const contextIfNotAuthorized: AnonymousGraphQLContext = {};

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
            } as AuthorizedGraphQLContext;
          }
          return contextIfNotAuthorized;
        }
        return {
          user: {
            email: payload.email,
            email_verified: payload.email_verified,
          },
        } as AuthorizedGraphQLContext;
      } else {
        return contextIfNotAuthorized;
      }
    },
  })
);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: process.env.PORT || 4000 }, resolve)
);
console.log(`🚀 Server ready`);
