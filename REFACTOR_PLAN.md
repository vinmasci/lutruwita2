# TypeScript Refactoring Plan for Lutruwita Project

## Overview

This document outlines a comprehensive plan to refactor the Lutruwita project's TypeScript implementation. The goal is to resolve current type conflicts while maintaining all functionality and improving type safety.

## Phase 1: Configuration Setup (1-2 hours)

### Purpose
Establish a proper TypeScript configuration hierarchy that separates concerns between server and client while maintaining consistent base rules.

### Tasks

1. ✅ **Create Configuration Files Structure**
```
├── tsconfig.base.json     # Shared base configuration
├── tsconfig.server.json   # Server-specific config
└── tsconfig.client.json   # Client-specific config
```

2. ✅ **Base Configuration (tsconfig.base.json)**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

3. ✅ **Server Configuration (tsconfig.server.json)**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node", "express", "express-openid-connect"]
  },
  "include": ["server.ts", "src/types/**/*", "src/server/**/*"],
  "exclude": ["src/client/**/*"]
}
```

### Expected Outcome
- Clear separation of server and client TypeScript configurations
- Proper module resolution
- Consistent base rules across the project

## Phase 2: Type Definitions (2-3 hours)

### Purpose
Create a robust type system that properly handles Auth0, Express, and custom types while eliminating current conflicts.

### New Type Structure
```
src/types/
├── auth.types.ts         # Auth0 related types
├── express.types.ts      # Express related types
├── api.types.ts          # API request/response types
└── database.types.ts     # Database model types
```

### Key Type Definitions

1. ✅ **auth.types.ts**
```typescript
import { OpenIDRequest } from 'express-openid-connect';

export interface Auth0User {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export interface Auth0Session {
  isAuthenticated(): boolean;
  user?: Auth0User;
}

export interface Auth0Request extends OpenIDRequest {
  oidc: Auth0Session;
}
```

2. ✅ **express.types.ts**
```typescript
import { Request, Response } from 'express';
import { Auth0Session } from './auth.types';

export interface TypedRequest<T = any> extends Request {
  body: T;
  oidc?: Auth0Session;
}

export interface TypedResponse<T = any> extends Response {
  json(body: T): this;
}

export interface ErrorResponse {
  error: string;
}

export type RequestHandler<Req = any, Res = any> = 
  (req: TypedRequest<Req>, res: TypedResponse<Res>) => Promise<void>;
```

### Expected Outcome
- Clear type definitions for all components
- Proper type inheritance
- Elimination of current type conflicts

## Phase 3: Server Refactoring (3-4 hours)

### Purpose
Restructure the server code to better handle types and separate concerns.

### New Server Structure
```
src/server/
├── middlewares/
│   ├── auth.ts           # Auth0 middleware
│   ├── error-handling.ts # Error handling
│   └── validation.ts     # Request validation
├── routes/
│   ├── photos.ts         # Photo-related routes
│   ├── routes.ts         # Route-related endpoints
│   └── profile.ts        # User profile endpoints
└── index.ts             # Main server file
```

### Key Implementation Examples

1. **Error Handling (middlewares/error-handling.ts)**
```typescript
import { ErrorRequestHandler } from 'express';
import { ErrorResponse } from '../types/express.types';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const response: ErrorResponse = {
    error: err.message || 'An unknown error occurred'
  };
  res.status(err.status || 500).json(response);
};
```

2. **Route Handler Example (routes/photos.ts)**
```typescript
import { RequestHandler } from '../types/express.types';
import { PhotoUploadRequest, PhotoUploadResponse } from '../types/api.types';

export const uploadPhoto: RequestHandler<PhotoUploadRequest, PhotoUploadResponse> = 
  async (req, res) => {
    try {
      // Implementation
    } catch (error) {
      throw new Error('Failed to upload photo');
    }
};
```

### Expected Outcome
- Modular server structure
- Type-safe route handlers
- Proper error handling
- Clear separation of concerns

## Phase 4: Route Handler Updates (2-3 hours)

### Purpose
Update all route handlers to use the new type system and ensure consistent error handling.

### Tasks

1. **Convert Existing Handlers**
- Update all route handlers to use new types
- Implement consistent error handling
- Add proper type checking for requests and responses

2. **Example Implementation**
```typescript
import { RequestHandler } from '../types/express.types';
import { MapDataRequest, MapDataResponse } from '../types/api.types';

export const createMap: RequestHandler<MapDataRequest, MapDataResponse> = 
  async (req, res) => {
    try {
      // Validate request
      if (!req.oidc?.user?.sub) {
        throw new Error('Unauthorized');
      }

      // Process request
      const result = await processMapData(req.body);

      // Send response
      res.json({
        success: true,
        mapId: result.id,
        data: result.data
      });
    } catch (error) {
      throw new Error('Failed to create map');
    }
  };
```

### Expected Outcome
- Type-safe route handlers
- Consistent error handling
- Proper request validation
- Clear response types

## Phase 5: Testing and Validation (2-3 hours)

### Purpose
Ensure the refactored code works correctly and maintains type safety.

### Test Categories

1. **Type Testing**
```typescript
// Example type test
const testUploadPhoto = async () => {
  const req = mockRequest<PhotoUploadRequest>({
    body: {
      longitude: '123.456',
      latitude: '-45.678',
      description: 'Test photo'
    }
  });
  
  const res = mockResponse<PhotoUploadResponse>();
  
  await uploadPhoto(req, res);
  
  // Assert response type is correct
  expectType<PhotoUploadResponse>(res.json.mock.calls[0][0]);
};
```

2. **API Testing**
- Create test suite for each endpoint
- Test all success and error cases
- Validate type safety at runtime

3. **Integration Testing**
- Test Auth0 integration
- Test database operations
- Test file uploads

### Expected Outcome
- Verified type safety
- Confirmed functionality
- Documented edge cases
- Reliable error handling

## Timeline

### Day 1 (4-5 hours)
- Complete Phase 1 (Configuration)
- Start Phase 2 (Type Definitions)

### Day 2 (4-5 hours)
- Complete Phase 2
- Start Phase 3 (Server Refactoring)

### Day 3 (4-5 hours)
- Complete Phase 3
- Start Phase 4 (Route Handlers)

### Day 4 (4-5 hours)
- Complete Phase 4
- Complete Phase 5 (Testing)

**Total Estimated Time: 16-20 hours**

## Recommendations

1. **Before Starting**
- Back up current codebase
- Create new git branch
- Document current functionality

2. **During Implementation**
- Commit after each phase
- Test thoroughly
- Document changes

3. **After Completion**
- Run full test suite
- Document type system
- Update API documentation

## Conclusion

This refactoring will resolve current TypeScript issues while improving code quality and maintainability. The modular approach allows for incremental implementation and testing, reducing risk and allowing for adjustments as needed.
