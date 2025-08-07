import { FastifyRequest, FastifyReply, FastifyInstance, FastifyError } from 'fastify';
import { JWT } from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

// Extend the FastifyInstance interface with custom decorators
declare module 'fastify' {
  // Custom error types
  export interface RateLimitError extends FastifyError {
    statusCode: 429;
    retryAfter?: number;
    error: string;
    message: string;
  }

  // JWT payload interface
  export interface JWTPayload {
    id: string;
    email: string;
    role?: string;
    iat?: number;
    exp?: number;
  }

  // User interface attached to request
  export interface User {
    id: string;
    email: string;
    role?: string;
    name?: string;
    isVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }

  // Extended FastifyInstance with custom decorators
  export interface FastifyInstance {
    // JWT decorator from @fastify/jwt
    jwt: JWT;
    
    // Custom authentication decorator
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    
    // Prisma client decorator
    prisma: PrismaClient;
    
    // Optional admin authentication decorator
    authenticateAdmin?: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    
    // Optional API key authentication decorator
    authenticateApiKey?: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  // Extended FastifyRequest with user and JWT
  export interface FastifyRequest {
    // User object attached after authentication
    user?: User | JWTPayload;
    
    // Admin user for admin routes
    adminUser?: {
      id: string;
      email: string;
    };
    
    // Raw body for webhook handling
    rawBody?: string;
    
    // JWT verification method from @fastify/jwt
    jwtVerify: (options?: any) => Promise<JWTPayload>;
    
    // Optional rate limit info
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: Date;
    };
    
    // Optional request context
    context?: {
      requestId?: string;
      traceId?: string;
      startTime?: number;
    };
  }

  // Extended FastifyReply
  export interface FastifyReply {
    // Custom send methods
    sendSuccess?: (data: any, message?: string) => FastifyReply;
    sendError?: (error: string, statusCode?: number, details?: any) => FastifyReply;
    
    // Rate limit headers
    setRateLimitHeaders?: (limit: number, remaining: number, reset: Date) => void;
  }

  // Extended FastifyError for validation
  export interface FastifyError {
    validation?: Array<{
      keyword: string;
      dataPath: string;
      schemaPath: string;
      params: Record<string, any>;
      message: string;
    }>;
    code?: string;
    statusCode?: number;
    name?: string;
    message?: string;
    stack?: string;
  }
  
  // Extended FastifyContextConfig
  export interface FastifyContextConfig {
    rawBody?: boolean;
  }
}

// Module declarations for plugins
declare module '@fastify/jwt' {
  export interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role?: string;
    };
    user: {
      id: string;
      email: string;
      role?: string;
      name?: string;
      isVerified?: boolean;
    };
  }
}

// Module declarations for multipart
declare module '@fastify/multipart' {
  export interface MultipartFile {
    toBuffer: () => Promise<Buffer>;
    file: NodeJS.ReadableStream;
    fieldname: string;
    filename: string;
    encoding: string;
    mimetype: string;
    fields: Record<string, { value: any }>;
  }
}

// Rate limit configuration types
export interface RateLimitConfig {
  max: number;
  timeWindow: string | number;
  redis?: any;
  nameSpace?: string;
  continueExceeding?: boolean;
  skipOnError?: boolean;
  keyGenerator?: (request: FastifyRequest) => string;
  errorResponseBuilder?: (request: FastifyRequest, context: any) => any;
  onExceeded?: (request: FastifyRequest, key: string) => void;
  onExceeding?: (request: FastifyRequest, key: string) => void;
}

// Request size limit types
export interface RequestSizeLimits {
  default: number;
  fileUpload: number;
  contentGeneration: number;
  bulkOperations: number;
}

// Error response types
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
  details?: any;
  retryAfter?: number;
  timestamp?: string;
  path?: string;
  method?: string;
}

// Success response types
export interface SuccessResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Filter types
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  categories?: string[];
}

// Export utility type guards
export function isRateLimitError(error: FastifyError): error is RateLimitError {
  return error.statusCode === 429;
}

export function hasValidationError(error: FastifyError): boolean {
  return Boolean(error.validation && error.validation.length > 0);
}

export function isAuthenticationError(error: FastifyError): boolean {
  return error.statusCode === 401 || 
         error.code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE' ||
         error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
         error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER';
}

// Plugin async types
export type FastifyPluginAsync = (
  fastify: FastifyInstance,
  options: any
) => Promise<void>;

// Route handler types
export type RouteHandler<TRequest = FastifyRequest, TReply = FastifyReply> = (
  request: TRequest,
  reply: TReply
) => Promise<any> | any;

// Middleware types
export type PreHandlerHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
) => void;

export type OnRequestHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
) => void;
