import { EventEmitter } from 'events';
import {
  MCPServerConfig,
  MCPServerInfo,
  MCPCapabilities,
  MCPToolDefinition,
  MCPToolCall,
  MCPToolResponse,
  MCPRequest,
  MCPResponse,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPErrorCode,
  MCPMethod,
  MCPServerMetrics,
  MCPToolExecutionContext,
  MCPResource,
  MCPPrompt
} from '../types';
import { MCPUtils, MCP_CONSTANTS } from '../utils';

/**
 * Base class for all MCP servers
 * Provides the foundation for implementing MCP protocol servers
 */
export abstract class MCPServer extends EventEmitter {
  protected config: MCPServerConfig;
  protected capabilities: MCPCapabilities;
  protected tools: Map<string, MCPToolDefinition>;
  protected resources: Map<string, MCPResource>;
  protected prompts: Map<string, MCPPrompt>;
  protected metrics: MCPServerMetrics;
  protected isInitialized: boolean = false;
  protected startTime: Date;
  private rateLimiter?: (clientId: string) => boolean;

  constructor(config: MCPServerConfig) {
    super();
    this.config = { ...config };
    this.startTime = new Date();
    this.tools = new Map();
    this.resources = new Map();
    this.prompts = new Map();
    
    // Initialize default capabilities
    this.capabilities = {
      tools: { listChanged: true },
      resources: { subscribe: false, listChanged: true },
      prompts: { listChanged: true },
      logging: {},
      ...config.capabilities
    };

    // Initialize metrics
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      uptime: 0,
      lastRequest: null,
      toolCalls: {}
    };

    // Register provided tools
    if (config.tools) {
      for (const tool of config.tools) {
        this.registerTool(tool);
      }
    }

    // Register provided resources
    if (config.resources) {
      for (const resource of config.resources) {
        this.registerResource(resource);
      }
    }

    // Register provided prompts
    if (config.prompts) {
      for (const prompt of config.prompts) {
        this.registerPrompt(prompt);
      }
    }

    this.setupRateLimiting();
  }

  /**
   * Initializes the MCP server
   */
  async initialize(params: MCPInitializeParams): Promise<MCPInitializeResult> {
    MCPUtils.log('info', `Initializing MCP server: ${this.config.name}`);

    // Validate protocol version compatibility
    if (!MCPUtils.isCompatibleVersion(params.protocolVersion, MCP_CONSTANTS.PROTOCOL_VERSION)) {
      throw new Error(`Incompatible protocol version. Client: ${params.protocolVersion}, Server: ${MCP_CONSTANTS.PROTOCOL_VERSION}`);
    }

    // Perform any custom initialization
    await this.onInitialize(params);

    this.isInitialized = true;
    
    const result: MCPInitializeResult = {
      protocolVersion: MCP_CONSTANTS.PROTOCOL_VERSION,
      capabilities: this.capabilities,
      serverInfo: this.getServerInfo()
    };

    this.emit('initialized', result);
    MCPUtils.log('info', `MCP server initialized successfully: ${this.config.name}`);

    return result;
  }

  /**
   * Handles incoming MCP requests
   */
  async handleRequest(request: any, clientId?: string): Promise<MCPResponse> {
    const startTime = performance.now();
    this.metrics.requestCount++;
    this.metrics.lastRequest = new Date();

    try {
      // Validate request structure
      if (!MCPUtils.validateRequest(request)) {
        this.metrics.errorCount++;
        return MCPUtils.createErrorResponse(
          request?.id || 'unknown',
          MCPErrorCode.InvalidRequest,
          'Invalid request structure'
        );
      }

      // Check rate limiting
      if (clientId && this.rateLimiter && !this.rateLimiter(clientId)) {
        this.metrics.errorCount++;
        return MCPUtils.createErrorResponse(
          request.id,
          MCPErrorCode.InternalError,
          'Rate limit exceeded'
        );
      }

      // Route request to appropriate handler
      let response: MCPResponse;
      
      switch (request.method) {
        case MCPMethod.Initialize:
          const initResult = await this.initialize(request.params);
          response = MCPUtils.createResponse(request.id, initResult);
          break;

        case MCPMethod.ListTools:
          const tools = Array.from(this.tools.values());
          response = MCPUtils.createResponse(request.id, { tools });
          break;

        case MCPMethod.CallTool:
          const toolResponse = await this.handleToolCall(request.params, clientId);
          response = MCPUtils.createResponse(request.id, toolResponse);
          break;

        case MCPMethod.ListResources:
          const resources = Array.from(this.resources.values());
          response = MCPUtils.createResponse(request.id, { resources });
          break;

        case MCPMethod.ReadResource:
          const resourceData = await this.handleReadResource(request.params);
          response = MCPUtils.createResponse(request.id, resourceData);
          break;

        case MCPMethod.ListPrompts:
          const prompts = Array.from(this.prompts.values());
          response = MCPUtils.createResponse(request.id, { prompts });
          break;

        case MCPMethod.GetPrompt:
          const promptData = await this.handleGetPrompt(request.params);
          response = MCPUtils.createResponse(request.id, promptData);
          break;

        case MCPMethod.Ping:
          response = MCPUtils.createResponse(request.id, {});
          break;

        default:
          // Allow custom method handling
          const customResult = await this.handleCustomMethod(request.method, request.params, clientId);
          if (customResult !== null) {
            response = MCPUtils.createResponse(request.id, customResult);
          } else {
            response = MCPUtils.createErrorResponse(
              request.id,
              MCPErrorCode.MethodNotFound,
              `Method not found: ${request.method}`
            );
          }
      }

      // Update metrics
      const duration = performance.now() - startTime;
      this.updateMetrics(duration, false);

      this.emit('requestHandled', { request, response, duration });
      return response;

    } catch (error) {
      this.metrics.errorCount++;
      const duration = performance.now() - startTime;
      this.updateMetrics(duration, true);

      MCPUtils.log('error', `Error handling request ${request?.method}:`, error);
      
      const errorResponse = MCPUtils.createErrorResponse(
        request?.id || 'unknown',
        MCPErrorCode.InternalError,
        error instanceof Error ? error.message : 'Internal server error'
      );

      this.emit('requestError', { request, error, response: errorResponse });
      return errorResponse;
    }
  }

  /**
   * Registers a new tool with the server
   */
  registerTool(tool: MCPToolDefinition): void {
    if (!MCPUtils.validateToolDefinition(tool)) {
      throw new Error(`Invalid tool definition: ${tool?.name || 'unknown'}`);
    }

    if (this.tools.size >= MCP_CONSTANTS.MAX_TOOLS_PER_SERVER) {
      throw new Error(`Maximum number of tools exceeded (${MCP_CONSTANTS.MAX_TOOLS_PER_SERVER})`);
    }

    this.tools.set(tool.name, tool);
    this.metrics.toolCalls[tool.name] = 0;
    
    MCPUtils.log('info', `Registered tool: ${tool.name}`);
    this.emit('toolRegistered', tool);
  }

  /**
   * Registers a new resource with the server
   */
  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    MCPUtils.log('info', `Registered resource: ${resource.name}`);
    this.emit('resourceRegistered', resource);
  }

  /**
   * Registers a new prompt with the server
   */
  registerPrompt(prompt: MCPPrompt): void {
    this.prompts.set(prompt.name, prompt);
    MCPUtils.log('info', `Registered prompt: ${prompt.name}`);
    this.emit('promptRegistered', prompt);
  }

  /**
   * Gets server information
   */
  getServerInfo(): MCPServerInfo {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      author: this.config.author,
      license: this.config.license
    };
  }

  /**
   * Gets server metrics
   */
  getMetrics(): MCPServerMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime.getTime()
    };
  }

  /**
   * Shuts down the server gracefully
   */
  async shutdown(): Promise<void> {
    MCPUtils.log('info', `Shutting down MCP server: ${this.config.name}`);
    
    await this.onShutdown();
    this.isInitialized = false;
    
    this.emit('shutdown');
    MCPUtils.log('info', `MCP server shut down: ${this.config.name}`);
  }

  // Abstract methods to be implemented by concrete servers

  /**
   * Called during server initialization
   */
  protected abstract onInitialize(params: MCPInitializeParams): Promise<void>;

  /**
   * Called during server shutdown
   */
  protected abstract onShutdown(): Promise<void>;

  /**
   * Executes a tool call
   */
  protected abstract executeTool(
    toolName: string, 
    args: Record<string, any>, 
    context: MCPToolExecutionContext
  ): Promise<MCPToolResponse>;

  /**
   * Reads a resource
   */
  protected abstract readResource(uri: string): Promise<{ contents: any; mimeType?: string }>;

  /**
   * Gets a prompt
   */
  protected abstract getPrompt(name: string, args?: Record<string, any>): Promise<{ messages: any[] }>;

  // Private helper methods

  private async handleToolCall(params: any, clientId?: string): Promise<MCPToolResponse> {
    if (!params?.name || typeof params.name !== 'string') {
      return MCPUtils.createToolErrorResponse('Tool name is required');
    }

    const tool = this.tools.get(params.name);
    if (!tool) {
      return MCPUtils.createToolErrorResponse(`Tool not found: ${params.name}`);
    }

    // Validate and sanitize arguments
    const args = params.arguments || {};
    const sanitizedArgs = MCPUtils.sanitizeArguments(args);
    
    const validation = MCPUtils.validateToolArguments(sanitizedArgs, tool.inputSchema);
    if (!validation.valid) {
      return MCPUtils.createToolErrorResponse(`Invalid arguments: ${validation.errors.join(', ')}`);
    }

    // Create execution context
    const context: MCPToolExecutionContext = {
      userId: clientId,
      requestId: MCPUtils.generateRequestId(),
      timestamp: new Date(),
      metadata: { toolName: params.name }
    };

    try {
      // Execute the tool
      const result = await this.executeTool(params.name, sanitizedArgs, context);
      
      // Update metrics
      this.metrics.toolCalls[params.name] = (this.metrics.toolCalls[params.name] || 0) + 1;
      
      this.emit('toolExecuted', { tool: params.name, args: sanitizedArgs, result, context });
      return result;
      
    } catch (error) {
      MCPUtils.log('error', `Tool execution failed: ${params.name}`, error);
      return MCPUtils.createToolErrorResponse(
        error instanceof Error ? error.message : 'Tool execution failed'
      );
    }
  }

  private async handleReadResource(params: any): Promise<any> {
    if (!params?.uri || typeof params.uri !== 'string') {
      throw new Error('Resource URI is required');
    }

    const resource = this.resources.get(params.uri);
    if (!resource) {
      throw new Error(`Resource not found: ${params.uri}`);
    }

    return await this.readResource(params.uri);
  }

  private async handleGetPrompt(params: any): Promise<any> {
    if (!params?.name || typeof params.name !== 'string') {
      throw new Error('Prompt name is required');
    }

    const prompt = this.prompts.get(params.name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${params.name}`);
    }

    return await this.getPrompt(params.name, params.arguments);
  }

  /**
   * Handles custom methods - override in subclasses
   */
  protected async handleCustomMethod(method: string, params: any, clientId?: string): Promise<any> {
    return null; // Method not found
  }

  private updateMetrics(duration: number, isError: boolean): void {
    if (isError) {
      this.metrics.errorCount++;
    }
    
    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;
  }

  private setupRateLimiting(): void {
    // Default rate limiting: 100 requests per minute
    this.rateLimiter = MCPUtils.createRateLimiter(100, 60000);
  }
}
