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
import { start_memory_server, stop_memory_server } from "./db/qdrant/start_memory_server.js";
import check_docker from "./common/check_docker.js";
import user_initialization from "./functions/user_initialization.js";
import logger from "./common/logger.js";
import { getCurrentCommitHash } from "./libs/github.js";
import start_cron from "./cron/index.js";
import { safeDatabaseSync } from "./db/sqlite/reconnect.js";

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

async function start_core_server() {
  // check docker is running
  await check_docker();

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  apolloServer = new ApolloServer<MyContext>({
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
    expressMiddleware(apolloServer as any, {
      context: async ({ req }: { req: any }) => {
        const contextIfNotAuthorized: AnonymousGraphQLContext = {};

        if (req.body.operationName === "IntrospectionQuery") {
          return contextIfNotAuthorized;
        }
        const token = req.headers.authorization || "";
        return await get_ctx_with_auth_token(token);
      },
    })  );  

  // Modified server startup
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve);
    safeDatabaseSync().then(async () => {
      user_initialization();
      cronJobs = await start_cron();
    }).catch((error) => {
      logger.error("Database sync failed:", error);
    });
  });
  logger.info(`🚀 Brofty Core Server ready!!!`);
}

async function stop_core_server(shouldCloseDB: boolean = true) {
  logger.info("Shutting down Brofty Core Server...");

  try {
    // Stop cron jobs first
    if (cronJobs && cronJobs.length > 0) {
      logger.info("Stopping cron jobs...");
      cronJobs.forEach((job) => {
        if (job && typeof job.stop === "function") {
          job.stop();
        }
      });
      cronJobs = [];
    }

    // Stop Apollo Server
    if (apolloServer) {
      logger.info("Stopping Apollo Server...");
      await apolloServer.stop();
      apolloServer = null;
    }

    // Stop the WebSocket server
    logger.info("Stopping WebSocket server...");
    await serverCleanup.dispose();

    // Close the HTTP server
    logger.info("Stopping HTTP server...");
    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) {
        reject(err);
        } else {
        resolve();
        }
      });
      });
    } else {
      logger.info("HTTP server is not running.");
    }

    // Stop memory server (Qdrant Docker container)
    logger.info("Stopping memory server...");
    await stop_memory_server();    // Only close database connections if explicitly requested (not during restart)
    if (shouldCloseDB) {
      logger.info("Closing database connections...");
      try {
        // Check if Sequelize is connected before closing
        await sequelize.authenticate();
        logger.info("Sequelize connection verified, closing...");
        await sequelize.close();
        logger.info("Database connection closed successfully");
      } catch (error) {
        logger.info("Sequelize is not connected or already closed:", (error as Error).message);
      }
    } else {
      logger.info("Keeping database connection open for restart");
    }

    logger.info("Brofty Core Server stopped successfully");
  } catch (error) {
    logger.error("Error during server shutdown:", error);
    throw error;
  }
}

export default start_core_server;
export { stop_core_server };
