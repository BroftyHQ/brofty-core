import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import http from "http";
import cors from "cors";
import typeDefs from "./typedefs/index.js";
import resolvers from "./resolvers/index.js";
import { WebSocketServer } from "ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
//@ts-ignore
import { useServer } from "graphql-ws/use/ws";
import { AnonymousGraphQLContext } from "./types/context.js";
import { IS_PRODUCTION } from "./common/constants.js";
import get_ctx_with_auth_token from "./get_ctx_with_auth_token.js";
import { parse } from "graphql";
import sequelize from "./db/sqlite/client.js";
import start_streaming_system_status from "./functions/system/start_streaming_system_status.js";
import { start_memory_server } from "./db/qdrant/start_memory_server.js";
import check_docker from "./common/check_docker.js";
import user_initialization from "./functions/user_initialization.js";
import logger from "./common/logger.js";
import { getCurrentCommitHash } from "./libs/github.js";

interface MyContext {
  token?: string;
}

export default async function start_core_server() {
  // check docker is running
  await check_docker();
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
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: any) => {
        return get_ctx_with_auth_token(
          ctx.connectionParams.authorization || ""
        );
      },
      onConnect: async (ctx) => {
        const context: any = await get_ctx_with_auth_token(
          (ctx.connectionParams.authorization as string) || ""
        );
        if (context.user && context.user.token) {
          // If the user is authenticated, we can start streaming system status
          start_streaming_system_status({
            user_token:context.user.token
          });
          return true;
        } else {
          return false;
        }
      },
      onSubscribe: async (ctx, id, payload) => {
        const context = await get_ctx_with_auth_token(
          (ctx.connectionParams.authorization as string) || ""
        );

        return {
          schema,
          operationName: payload.operationName,
          document: parse(payload.query),
          variableValues: payload.variables,
          contextValue: context,
        };
      },
    },
    wsServer
  );

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

  // start memory server 
  await start_memory_server();

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

  app.get("/rest/v1/status", corsConfig, (req, res) => {
    res.status(200).json({
      status: "ok",
      message: `Brofty SSR server is running in ${
        IS_PRODUCTION ? "production" : "development"
      } mode`,
    });
  });
    app.get("/test", corsConfig, (req, res) => {
      
    res.status(200).json({
      status: "ok",
      message: getCurrentCommitHash(),
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
    expressMiddleware(server as any, {
      context: async ({ req }: { req: any }) => {
        const contextIfNotAuthorized: AnonymousGraphQLContext = {};

        if (req.body.operationName === "IntrospectionQuery") {
          return contextIfNotAuthorized;
        }
        const token = req.headers.authorization || "";
        return await get_ctx_with_auth_token(token);
      },
    })
  );
  // Modified server startup
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve);
    sequelize.sync({ alter: true, logging: false }).then(() => {
      logger.info("Database synced successfully");
      user_initialization();
    });
  });
  logger.info(`🚀 Brofty Core Server ready`);
}
