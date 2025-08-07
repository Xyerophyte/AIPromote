# TypeScript Type Definitions

This directory contains custom TypeScript type definitions for the AI Promote backend application.

## Structure

- **`fastify.d.ts`** - Core Fastify type extensions and decorators
  - Custom error types (RateLimitError)
  - JWT payload and user interfaces
  - FastifyInstance extensions (authenticate, prisma decorators)
  - Request/Reply extensions
  - Module augmentations for @fastify/jwt and @fastify/multipart
  - Utility type guards and helper functions

- **`index.d.ts`** - Application-wide type definitions
  - Configuration interfaces (AppConfig)
  - Service response types
  - Database query options
  - File upload types
  - AI Strategy types
  - Content generation types
  - Social media types
  - Analytics and billing types
  - Utility types and type guards

- **`routes.d.ts`** - Route-specific type definitions
  - Startup intake form types
  - Request/Response interfaces for each route
  - Plugin types
  - Middleware interfaces
  - Validation schemas

## Usage

### Importing Types

```typescript
// Import Fastify extensions
import '../types/fastify';

// Import specific types
import { AuthenticatedRequest, StartupResponse } from '../types/routes';
import { ServiceResponse, AIStrategyRequest } from '../types';
```

### Type Guards

The type definitions include several type guard functions:

```typescript
import { isRateLimitError, isAuthenticationError, hasValidationError } from '../types/fastify';

// In error handler
if (isRateLimitError(error)) {
  // Handle rate limit error
}

if (isAuthenticationError(error)) {
  // Handle auth error
}

if (hasValidationError(error)) {
  // Handle validation error
}
```

### Extending Types

To add new type definitions:

1. Choose the appropriate file based on the scope:
   - Global/app-wide types → `index.d.ts`
   - Fastify-specific → `fastify.d.ts`
   - Route-specific → `routes.d.ts`

2. Follow the existing patterns:
   - Use interfaces for object shapes
   - Use type aliases for unions/intersections
   - Export all public types
   - Include JSDoc comments for complex types

3. Update this README with any significant additions

## TypeScript Configuration

The `tsconfig.json` is configured to:
- Include the `types` directory in compilation
- Add `types` to the typeRoots
- Enable strict type checking
- Generate declaration files and source maps

## Benefits

These type definitions provide:
- **Type Safety**: Catch errors at compile time
- **IntelliSense**: Better IDE support and autocomplete
- **Documentation**: Types serve as inline documentation
- **Refactoring**: Safer code refactoring with type checking
- **Consistency**: Enforced data structures across the application

## Common Patterns

### Authenticated Routes
```typescript
const handler: StartupRouteHandler = async (request, reply) => {
  const userId = request.user.id; // Type-safe access
  // ...
};
```

### Error Handling
```typescript
if (isRateLimitError(error)) {
  return reply.status(429).send({
    error: 'Too Many Requests',
    retryAfter: error.retryAfter
  });
}
```

### Service Responses
```typescript
function myService(): ServiceResponse<MyData> {
  return {
    success: true,
    data: { /* ... */ }
  };
}
```
