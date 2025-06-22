import { RouteDefinition, HttpMethod, RouteHandler } from "../types/routes.js";
import { Request, Response, NextFunction } from "express";

/**
 * Helper function to create route definitions more easily
 */
export const createRoute = (
  method: HttpMethod,
  path: string,
  handler: RouteHandler,
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>
): RouteDefinition => ({
  method,
  path,
  handler,
  middleware
});

/**
 * Convenience functions for common HTTP methods
 */
export const GET = (path: string, handler: RouteHandler, middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>) =>
  createRoute('GET', path, handler, middleware);

export const POST = (path: string, handler: RouteHandler, middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>) =>
  createRoute('POST', path, handler, middleware);

export const PUT = (path: string, handler: RouteHandler, middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>) =>
  createRoute('PUT', path, handler, middleware);

export const DELETE = (path: string, handler: RouteHandler, middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>) =>
  createRoute('DELETE', path, handler, middleware);

export const PATCH = (path: string, handler: RouteHandler, middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>) =>
  createRoute('PATCH', path, handler, middleware);
