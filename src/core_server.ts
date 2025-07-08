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
import get_ctx_with_auth_token from "./get_ctx_with_auth_token.js";
import { parse } from "graphql";
import start_streaming_system_status, { cleanup_system_status_on_disconnect } from "./functions/system/start_streaming_system_status.js";
import {
  start_memory_server,
  stop_memory_server,
} from "./db/qdrant/start_memory_server.js";
import check_docker from "./common/check_docker.js";
import logger from "./common/logger.js";
import start_cron from "./cron/index.js";
import { safeDatabaseSync } from "./db/sqlite/reconnect.js";
import { v1Router } from "./rest/index.js";
import { setServerInstances } from "./stop-core-server.js";
import user_initialization from "./functions/user_initialization.js";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { FILE_VALIDATION_CONFIG } from "./common/file-utils.js";
import { fileUploadErrorHandler } from "./common/upload-error-handler.js";
import path from "path";

interface MyContext {
  token?: string;
}

// Global server instances for cleanup
let apolloServer: ApolloServer<MyContext> | null = null;
let cronJobs: any[] = [];

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
      return get_ctx_with_auth_token(ctx.connectionParams.authorization || "");
    },
    onConnect: async (ctx) => {
      const context: any = await get_ctx_with_auth_token(
        (ctx.connectionParams.authorization as string) || ""
      );
      if (context.user && context.user.token) {
        // If the user is authenticated, we can start streaming system status
        start_streaming_system_status({
          user_token: context.user.token,
        });
        return true;
      } else {
        return false;
      }
    },
    onDisconnect: async (ctx) => {
      // Clean up system status streaming when user disconnects
      const context: any = await get_ctx_with_auth_token(
        (ctx.connectionParams.authorization as string) || ""
      );
      if (context.user && context.user.token) {
        cleanup_system_status_on_disconnect(context.user.token);
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

// set static directory for serving static files
app.use("/resources", express.static(path.join(process.cwd(), "static")));

async function start_core_server() {
  // check docker is running
  await check_docker();

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  apolloServer = new ApolloServer<MyContext>({
    schema,
    // Disable CSRF prevention temporarily for debugging
    csrfPrevention: false,
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
  await apolloServer.start();

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
  // Mount REST routes
  app.use("/rest/v1", corsConfig, v1Router);

  // Set up our Express middleware to handle CORS, body parsing,
  // and our expressMiddleware function.
  app.use(
    "/v1",
    corsConfig,
    // Handle multipart/form-data uploads with error handling
    (req: any, res: any, next: any) => {
      graphqlUploadExpress({
        maxFileSize: FILE_VALIDATION_CONFIG.MAX_FILE_SIZE,
        maxFiles: FILE_VALIDATION_CONFIG.MAX_FILES,
      })(req, res, (error: any) => {
        if (error) {
          fileUploadErrorHandler(error, req, res, next);
        } else {
          next();
        }
      });
    },
    express.json({ limit: FILE_VALIDATION_CONFIG.MAX_FILE_SIZE }),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(apolloServer as any, {
      context: async ({ req }: { req: any }) => {
        const contextIfNotAuthorized: AnonymousGraphQLContext = {};

        if (req.body === undefined || req.body.operationName === undefined) {
          return contextIfNotAuthorized;
        }

        if (req.body.operationName === "IntrospectionQuery") {
          return contextIfNotAuthorized;
        }
        const token = req.headers.authorization || "";
        return await get_ctx_with_auth_token(token);
      },
    })
  );
  // wait 5 seconds before starting the server
  // for memory server to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Modified server startup
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve);
    safeDatabaseSync()
      .then(async () => {
        cronJobs = await start_cron();
        user_initialization();
        // Set server instances for graceful shutdown
        setServerInstances({
          apolloServer,
          cronJobs,
          httpServer,
          serverCleanup,
        });
      })
      .catch((error) => {
        logger.error("Database sync failed:", error);
      });
  });
  logger.info(`🚀 Brofty Core Server ready!!!`);
}

export default start_core_server;
