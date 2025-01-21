import { OpenidRequest, AccessToken } from 'express-openid-connect';

export interface Auth0User {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export interface Auth0Session {
  isAuthenticated(): boolean;
  fetchUserInfo(): Promise<Auth0User>;
  user?: Auth0User;
  claims: Record<string, any>;
  idToken: string;
  accessToken: AccessToken;
  refreshToken?: string;
  tokenType: string;
  expiresAt: number;
}

export interface Auth0Request extends OpenidRequest {
  oidc: Auth0Session;
}

export interface AuthenticatedRequest extends Auth0Request {
  oidc: Required<Auth0Session>;  // Ensures oidc is always present
}