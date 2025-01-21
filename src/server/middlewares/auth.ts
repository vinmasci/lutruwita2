import { Express, Response, NextFunction } from 'express';
import { auth as Auth0 } from 'express-openid-connect';
import { Auth0Request, Auth0MiddlewareHandler, Auth0CallbackHandler } from '../../types/auth.types';

export const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: 'http://localhost:3001',
  clientID: 'hLnq0z7KNvwcORjFF9KdC4kGPtu51kVB',
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: 'https://dev-8jmwfh4hugvdjwh8.au.auth0.com',
  routes: {
    callback: '/callback',
    postLogoutRedirect: 'http://localhost:5173'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  },
  session: {
    absoluteDuration: 24 * 60 * 60
  },
  logoutParams: {
    returnTo: 'http://localhost:5173'
  }
};

export const configureAuth = (app: Express): void => {
  // Configure Auth0
  app.use(Auth0(authConfig));

  // Add authentication state logging middleware
  const loggingMiddleware: Auth0MiddlewareHandler = (req, res, next) => {
    console.log('Authentication state:', req.oidc?.isAuthenticated() ? 'Authenticated' : 'Not authenticated');
    console.log('User info:', req.oidc?.user);
    next();
  };
  app.use(loggingMiddleware);

  // Handle successful authentication
  const callbackHandler: Auth0CallbackHandler = (req, res) => {
    console.log('Callback route hit - redirecting to frontend');
    res.redirect('http://localhost:5173');
  };
  app.get('/callback', callbackHandler);
};

// Middleware to ensure user is authenticated
export const requireAuth: Auth0MiddlewareHandler = (req, res, next) => {
  try {
    if (!req.oidc?.isAuthenticated()) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to ensure user is admin
export const requireAdmin: Auth0MiddlewareHandler = (req, res, next) => {
  try {
    if (!req.oidc?.isAuthenticated()) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has admin role/permissions
    // You'll need to implement this based on your user data structure
    const isAdmin = false; // Replace with actual admin check
    
    if (!isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};
