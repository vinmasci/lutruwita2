# Development Log

## Session: GPX Refactor (March 19, 2024)

### Initial Issue
Error when starting backend server:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/vincentmasci/Desktop/lutruwita2/src/services/gpx-processor.js' imported from /Users/vincentmasci/Desktop/lutruwita2/server.js
```

The error indicated Node.js was trying to find a .js file for gpx-processor, but we have a .ts file.

### Root Cause Analysis
The core issue is that we've converted the server to TypeScript (server.ts) but there are still JavaScript files and mixed module systems causing conflicts:

1. Duplicate Files:
   - Both server.js and server.ts exist
   - Multiple storage service type definitions
   - Potential .js files that should be .ts

2. Module System Issues:
   - Project is set to use ES modules ("type": "module" in package.json)
   - Some files using require() (CommonJS) instead of import/export (ES Modules)
   - TypeScript configuration mixing ES modules with CommonJS

### Step-by-Step Fix Plan

1. ✅ Clean Up Server Files:
   ```bash
   # After verifying server.ts is complete:
   rm server.js
   ```
   - Verified server.ts contains all necessary functionality
   - Successfully removed server.js

2. ✅ Fix TypeScript Configuration:
   - Verified tsconfig.server.json already has correct settings:
     - Using CommonJS for Node.js compatibility
     - No problematic path aliases present
     - resolveJsonModule already enabled
     - Proper module resolution and ES2022 target

3. ✅ Consolidate Type Definitions:
   - Verified only one storage service type definition exists in src/types
   - No duplicate .d.ts files found to remove
   - Type definition properly defines StorageService class with required methods

4. ✅ Convert JavaScript Files to TypeScript:
   - Searched for .js files in src/
   - No JavaScript files found - all files already using TypeScript (.ts)
   - No conversion needed as migration to TypeScript is complete

5. ✅ Fix Module Imports:
   - Verified server.ts already using ES module imports correctly
   - No require() calls found that needed conversion
   - File extensions in imports already using .ts where needed
   - Project correctly configured with "type": "module" in package.json

6. 🔄 Build Process:
   ```bash
   # Clean the dist directory
   rm -rf dist/
   
   # Rebuild the server
   npm run build:server
   ```
   - Found TypeScript errors in server.ts that need to be fixed:
     - Duplicate RequestContext import
     - Type compatibility issues with Express middleware
     - Request handler return type issues
     - Auth0 type integration problems

7. Test Server:
   ```bash
   # Start the server
   npm run server
   
   # In another terminal, test API endpoints
   curl http://localhost:3001/health
   ```

8. Update Documentation:
   - Update README with new build/run instructions
   - Document any changes to the development workflow
   - Note TypeScript/ES Module requirements

### Current Status (March 19, 2024 - Update 10)
Progress on fixing TypeScript errors:

1. ✅ Fixed server configuration:
   - Updated tsconfig.server.json to only include necessary files
   - Removed frontend files from server compilation

2. ✅ Improved type definitions:
   - Added proper RequestContext import from express-openid-connect
   - Created HandlerResponse type for consistent return types
   - Updated CustomRequestHandler to match Express types

3. 🔄 Working on Auth0 type integration:
   - Current errors:
   ```typescript
   - Interface 'RequestWithAuth' incorrectly extends interface 'Request'
   - Types of property 'oidc' are incompatible
   - Type 'Record<string, any>' is missing properties from type 'Auth0User'
   ```

4. 🔄 Working on request handler compatibility:
   - Current errors:
   ```typescript
   - No overload matches this call for route handlers
   - CustomRequestHandler not assignable to RequestHandlerParams
   - Type mismatches between wrapped handlers and Express types
   ```

### Next Steps
1. Fix remaining server-side type compatibility issues:
   - Update CustomRequestHandler to properly handle response types
   - Fix return type issues in request handlers
   - Ensure proper typing for error responses

2. Address frontend TypeScript errors:
   - POI Type System:
     - Fix type compatibility between POI and its subtypes (Infrastructure, Services, etc.)
     - Ensure proper typing for POI state management
     - Address type mismatches in POI markers and events
   
   - Import Path Issues:
     - Update tsconfig.json to handle .tsx extensions properly
     - Fix import statements using relative paths
     - Address module resolution for UI components
   
   - Component Props:
     - Define proper types for all component props
     - Fix missing property errors in MapContainer and POI components
     - Ensure type safety in state management
   
   - Type Annotations:
     - Add explicit types to parameters marked as 'any'
     - Define proper return types for functions
     - Create interfaces for complex state objects

3. Test TypeScript compilation
4. Verify server startup
5. Test frontend functionality

### Notes
- Need to ensure request handlers properly type their responses
- Consider creating specific response type interfaces
- May need to update error handling utilities to match types
- Frontend type system needs consolidation, especially around POI functionality
- Consider creating a comprehensive type definition file for POI-related types
