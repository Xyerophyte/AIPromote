/**
 * MCP (Model Context Protocol) Types
 * Defines the structure for MCP tools, responses, and server communication
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
}

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: {};
}

export interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

export interface MCPRequest {
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  method: string;
  params?: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPLoggingLevel {
  level: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';
}

export interface MCPProgress {
  progressToken: string | number;
  progress: number;
  total?: number;
}

// Error codes as defined in MCP specification
export enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603
}

// MCP method names
export enum MCPMethod {
  Initialize = 'initialize',
  Initialized = 'initialized',
  ListTools = 'tools/list',
  CallTool = 'tools/call',
  ListResources = 'resources/list',
  ReadResource = 'resources/read',
  ListPrompts = 'prompts/list',
  GetPrompt = 'prompts/get',
  SetLoggingLevel = 'logging/setLevel',
  Progress = 'progress',
  Ping = 'ping'
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  capabilities?: MCPCapabilities;
  tools?: MCPToolDefinition[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

export interface MCPServerMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
  lastRequest: Date | null;
  toolCalls: Record<string, number>;
}

export interface MCPToolExecutionContext {
  userId?: string;
  sessionId?: string;
  requestId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
