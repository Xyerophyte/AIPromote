import { MCPResponse, MCPRequest, MCPErrorCode, MCPToolResponse, MCPToolDefinition } from '../types';

/**
 * Utility functions for MCP server operations
 */

export class MCPUtils {
  /**
   * Creates a standardized MCP response
   */
  static createResponse(id: string | number, result?: any, error?: { code: number; message: string; data?: any }): MCPResponse {
    return {
      id,
      ...(result !== undefined && { result }),
      ...(error && { error })
    };
  }

  /**
   * Creates a standardized MCP error response
   */
  static createErrorResponse(id: string | number, code: MCPErrorCode, message: string, data?: any): MCPResponse {
    return {
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * Creates a success tool response
   */
  static createToolResponse(content: string | Array<{ type: 'text' | 'image' | 'resource'; text?: string; data?: string; mimeType?: string }>): MCPToolResponse {
    if (typeof content === 'string') {
      return {
        content: [{ type: 'text', text: content }],
        isError: false
      };
    }
    return {
      content,
      isError: false
    };
  }

  /**
   * Creates an error tool response
   */
  static createToolErrorResponse(message: string): MCPToolResponse {
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true
    };
  }

  /**
   * Validates MCP request structure
   */
  static validateRequest(request: any): request is MCPRequest {
    return (
      typeof request === 'object' &&
      request !== null &&
      (typeof request.id === 'string' || typeof request.id === 'number') &&
      typeof request.method === 'string'
    );
  }

  /**
   * Validates tool definition schema
   */
  static validateToolDefinition(tool: any): tool is MCPToolDefinition {
    return (
      typeof tool === 'object' &&
      tool !== null &&
      typeof tool.name === 'string' &&
      typeof tool.description === 'string' &&
      typeof tool.inputSchema === 'object' &&
      tool.inputSchema !== null &&
      tool.inputSchema.type === 'object' &&
      typeof tool.inputSchema.properties === 'object'
    );
  }

  /**
   * Validates tool arguments against schema
   */
  static validateToolArguments(args: any, schema: MCPToolDefinition['inputSchema']): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!args || typeof args !== 'object') {
      errors.push('Arguments must be an object');
      return { valid: false, errors };
    }

    // Check required properties
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in args)) {
          errors.push(`Missing required property: ${required}`);
        }
      }
    }

    // Basic type validation for properties
    for (const [key, value] of Object.entries(args)) {
      const propertySchema = schema.properties[key];
      if (propertySchema && propertySchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (propertySchema.type !== actualType) {
          errors.push(`Property '${key}' should be of type '${propertySchema.type}' but got '${actualType}'`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generates a unique request ID
   */
  static generateRequestId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Sanitizes tool arguments to prevent injection attacks
   */
  static sanitizeArguments(args: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string') {
        // Basic sanitization - remove potentially dangerous characters
        sanitized[key] = value
          .replace(/[<>]/g, '') // Remove angle brackets
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeArguments(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Logs MCP server activity
   */
  static log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] MCP ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  /**
   * Measures execution time of async functions
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.log('debug', `${label} completed in ${duration.toFixed(2)}ms`);
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.log('error', `${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Creates a rate limiter for MCP requests
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (clientId: string): boolean => {
      const now = Date.now();
      const clientRequests = requests.get(clientId) || [];
      
      // Remove old requests outside the window
      const validRequests = clientRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(clientId, validRequests);
      return true;
    };
  }

  /**
   * Formats bytes for human reading
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Validates MCP protocol version compatibility
   */
  static isCompatibleVersion(clientVersion: string, serverVersion: string): boolean {
    const parseVersion = (version: string) => {
      const parts = version.split('.').map(Number);
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
    };

    const client = parseVersion(clientVersion);
    const server = parseVersion(serverVersion);

    // Major versions must match for compatibility
    return client.major === server.major;
  }

  /**
   * Deep clones an object to prevent mutation
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }
}

/**
 * MCP Protocol Constants
 */
export const MCP_CONSTANTS = {
  PROTOCOL_VERSION: '2024-11-05',
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  HEARTBEAT_INTERVAL: 60000, // 1 minute
  MAX_TOOLS_PER_SERVER: 100,
  MAX_ARGUMENT_SIZE: 64 * 1024 // 64KB
} as const;
