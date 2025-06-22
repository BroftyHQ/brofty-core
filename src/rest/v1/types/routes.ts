import { Request, Response, NextFunction } from "express";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void | Promise<void>;

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}
