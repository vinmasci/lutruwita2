import { Request, Response } from 'express';
import { Auth0Session } from './auth.types';

declare module 'express' {
  interface Request {
    oidc?: Auth0Session;
  }
}

export interface TypedRequest<T = any> extends Request {
  body: T;
}

export interface TypedResponse<T = any> extends Response {
  json: (body: T) => this;
}

export interface ErrorResponse {
  error: string;
}

export type RequestHandler<Req = any, Res = any> = 
  (req: TypedRequest<Req>, res: TypedResponse<Res>) => Promise<void>;
