import { Router } from "express";
import { getStatus } from "../resolvers/status.js";
import { RouteDefinition } from "../types/routes.js";
import { GET, POST, PUT, DELETE, PATCH } from "../utils/routes.js";
import { restartCoreServer } from "../resolvers/restartCoreServer.js";

const v1Router = Router();

/**
 * Route definitions - just define the path and method without /rest/v1 prefix
 * The prefix will be handled by the parent router
 * 
 * Usage examples:
 * GET('/status', getStatus)
 * POST('/users', createUser, [authMiddleware, validateUser])
 * PUT('/users/:id', updateUser, [authMiddleware])
 */
const routes: RouteDefinition[] = [
  GET('/status', getStatus),
  GET('/restart', restartCoreServer),
  // Add more routes here following the same pattern:
  // POST('/users', createUser),
  // GET('/users/:id', getUser),
  // PUT('/users/:id', updateUser, [authMiddleware]),
  // DELETE('/users/:id', deleteUser, [authMiddleware]),
];

/**
 * Automatically register all routes
 */
routes.forEach(({ method, path, handler, middleware = [] }) => {
  switch (method.toUpperCase()) {
    case 'GET':
      v1Router.get(path, ...middleware, handler);
      break;
    case 'POST':
      v1Router.post(path, ...middleware, handler);
      break;
    case 'PUT':
      v1Router.put(path, ...middleware, handler);
      break;
    case 'DELETE':
      v1Router.delete(path, ...middleware, handler);
      break;
    case 'PATCH':
      v1Router.patch(path, ...middleware, handler);
      break;
    default:
      console.warn(`Unsupported HTTP method: ${method}`);
  }
});

export default v1Router;
