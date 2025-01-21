import { Request, Response } from 'express';
import { Auth0Session } from './auth.types';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

declare module 'express' {
  interface Request {
    oidc?: Auth0Session;
  }
}

export interface RequestWithFile<T = any> extends Request {
  body: T;
  oidc?: Auth0Session;
  file?: Express.Multer.File;
  query: ParsedQs;
  params: ParamsDictionary;
}

export interface TypedRequest<T = any> extends Request {
  body: T;
  oidc?: Auth0Session;
  query: ParsedQs;
  params: ParamsDictionary;
}

export interface TypedResponse<T = any> extends Response {
  json(body: T | ErrorResponse): this;
  status(code: number): this;
}

export interface ErrorResponse {
  error: string;
}

export type AsyncRequestHandler<Req = any, Res = any> = 
  (req: RequestWithFile<Req> | TypedRequest<Req>, res: TypedResponse<Res>) => Promise<void>;

// Express middleware type with error handling
export type ErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: (error?: Error) => void
) => void;

// Type for request validation middleware
export type ValidationMiddleware = (
  req: Request,
  res: Response,
  next: (error?: Error) => void
) => void;