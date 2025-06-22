# REST API Route Management

This directory contains a simplified route management system for the REST API endpoints.

## How to Add New Routes

Instead of manually defining routes with the full `/rest/v1` prefix, you can now simply add routes to the `routes` array in `routes/index.ts`.

### Basic Usage

```typescript
import { GET, POST, PUT, DELETE, PATCH } from "../utils/routes.js";
import { yourHandler } from "../resolvers/your-resolver.js";

const routes: RouteDefinition[] = [
  GET('/status', getStatus),
  POST('/users', createUser),
  GET('/users/:id', getUser),
  PUT('/users/:id', updateUser),
  DELETE('/users/:id', deleteUser),
];
```

### With Middleware

```typescript
import { authMiddleware, validateUser } from "../middleware/index.js";

const routes: RouteDefinition[] = [
  GET('/public-endpoint', handler),
  POST('/protected-endpoint', handler, [authMiddleware]),
  POST('/users', createUser, [authMiddleware, validateUser]),
];
```

## Directory Structure

- `routes/index.ts` - Main router configuration and route definitions
- `resolvers/` - Route handlers (controllers)
- `types/routes.ts` - TypeScript type definitions for routes
- `utils/routes.ts` - Helper functions for creating route definitions
- `middleware/` - Express middleware functions (if needed)

## Benefits

1. **No URL prefix repetition** - Routes are automatically prefixed with `/rest/v1`
2. **Type safety** - Full TypeScript support with proper types
3. **Middleware support** - Easy to add middleware to specific routes
4. **Clean syntax** - Use helper functions like `GET()`, `POST()`, etc.
5. **Automatic registration** - Routes are automatically registered with Express

## API Endpoints

All routes defined in this system will be accessible at:
- Base URL: `http://localhost:PORT/rest/v1`
- Example: `GET /status` becomes `http://localhost:PORT/rest/v1/status`
