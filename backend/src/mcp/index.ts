/**
 * MCP (Model Context Protocol) Module
 * Main entry point for MCP server infrastructure
 */

// Export all types
export * from './types';

// Export base server class
export { MCPServer } from './base/MCPServer';

// Export utilities
export { MCPUtils, MCP_CONSTANTS } from './utils';

// Re-export configuration
export * from '../config/mcp.config';

// Version and metadata
export const MCP_MODULE_VERSION = '1.0.0';
export const MCP_MODULE_NAME = 'AIPromote MCP Infrastructure';
