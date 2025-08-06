import { MCPServer } from '../base/MCPServer';
import {
  MCPServerConfig,
  MCPInitializeParams,
  MCPToolResponse,
  MCPToolExecutionContext
} from '../types';
import { MCPUtils } from '../utils';

/**
 * Sample MCP Server Implementation
 * Demonstrates how to create a concrete MCP server using the base class
 */
export class SampleMCPServer extends MCPServer {
  constructor(config: MCPServerConfig) {
    super(config);
  }

  /**
   * Initialize the server - called during MCP initialization
   */
  protected async onInitialize(params: MCPInitializeParams): Promise<void> {
    MCPUtils.log('info', 'Initializing Sample MCP Server');
    
    // Perform any custom initialization here
    // e.g., connect to databases, load models, etc.
    
    MCPUtils.log('info', 'Sample MCP Server initialization completed');
  }

  /**
   * Shutdown the server - called during graceful shutdown
   */
  protected async onShutdown(): Promise<void> {
    MCPUtils.log('info', 'Shutting down Sample MCP Server');
    
    // Perform cleanup here
    // e.g., close database connections, save state, etc.
    
    MCPUtils.log('info', 'Sample MCP Server shutdown completed');
  }

  /**
   * Execute a tool call
   */
  protected async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResponse> {
    MCPUtils.log('info', `Executing tool: ${toolName}`, { args, context });

    try {
      switch (toolName) {
        case 'echo':
          return this.handleEcho(args);
        
        case 'generate_greeting':
          return this.handleGenerateGreeting(args);
        
        case 'calculate':
          return this.handleCalculate(args);
        
        default:
          return MCPUtils.createToolErrorResponse(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      MCPUtils.log('error', `Tool execution error for ${toolName}:`, error);
      return MCPUtils.createToolErrorResponse(
        error instanceof Error ? error.message : 'Tool execution failed'
      );
    }
  }

  /**
   * Read a resource
   */
  protected async readResource(uri: string): Promise<{ contents: any; mimeType?: string }> {
    MCPUtils.log('info', `Reading resource: ${uri}`);

    switch (uri) {
      case 'sample://config':
        return {
          contents: {
            serverName: this.config.name,
            version: this.config.version,
            uptime: Date.now() - this.startTime.getTime()
          },
          mimeType: 'application/json'
        };
      
      case 'sample://status':
        return {
          contents: {
            status: 'running',
            metrics: this.getMetrics()
          },
          mimeType: 'application/json'
        };
      
      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  }

  /**
   * Get a prompt
   */
  protected async getPrompt(name: string, args?: Record<string, any>): Promise<{ messages: any[] }> {
    MCPUtils.log('info', `Getting prompt: ${name}`, { args });

    switch (name) {
      case 'greeting':
        return {
          messages: [
            {
              role: 'system',
              content: 'You are a friendly AI assistant.'
            },
            {
              role: 'user',
              content: `Say hello to ${args?.name || 'there'}!`
            }
          ]
        };
      
      case 'code_review':
        return {
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer. Provide constructive feedback on the code.'
            },
            {
              role: 'user',
              content: `Please review this code:\n\n${args?.code || 'No code provided'}`
            }
          ]
        };
      
      default:
        throw new Error(`Prompt not found: ${name}`);
    }
  }

  // Private helper methods for tool implementations

  private async handleEcho(args: Record<string, any>): Promise<MCPToolResponse> {
    const message = args.message || 'Hello, World!';
    return MCPUtils.createToolResponse(`Echo: ${message}`);
  }

  private async handleGenerateGreeting(args: Record<string, any>): Promise<MCPToolResponse> {
    const name = args.name || 'there';
    const style = args.style || 'casual';
    
    let greeting: string;
    
    switch (style) {
      case 'formal':
        greeting = `Good day, ${name}. It is a pleasure to make your acquaintance.`;
        break;
      case 'casual':
        greeting = `Hey ${name}! How's it going?`;
        break;
      case 'professional':
        greeting = `Hello ${name}, welcome to our service.`;
        break;
      default:
        greeting = `Hi ${name}!`;
    }
    
    return MCPUtils.createToolResponse(greeting);
  }

  private async handleCalculate(args: Record<string, any>): Promise<MCPToolResponse> {
    const { operation, a, b } = args;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      return MCPUtils.createToolErrorResponse('Both operands must be numbers');
    }
    
    let result: number;
    
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return MCPUtils.createToolErrorResponse('Division by zero is not allowed');
        }
        result = a / b;
        break;
      default:
        return MCPUtils.createToolErrorResponse(`Unknown operation: ${operation}`);
    }
    
    return MCPUtils.createToolResponse(`${a} ${operation} ${b} = ${result}`);
  }
}

// Example configuration for the sample server
export const sampleServerConfig: MCPServerConfig = {
  name: 'Sample MCP Server',
  version: '1.0.0',
  description: 'A sample MCP server demonstrating basic functionality',
  author: 'AIPromote Team',
  license: 'MIT',
  capabilities: {
    tools: { listChanged: true },
    resources: { subscribe: false, listChanged: true },
    prompts: { listChanged: true },
    logging: {}
  },
  tools: [
    {
      name: 'echo',
      description: 'Echoes back the provided message',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The message to echo' }
        },
        required: ['message']
      }
    },
    {
      name: 'generate_greeting',
      description: 'Generates a personalized greeting',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the person to greet' },
          style: { 
            type: 'string', 
            enum: ['formal', 'casual', 'professional'],
            description: 'Style of the greeting'
          }
        },
        required: ['name']
      }
    },
    {
      name: 'calculate',
      description: 'Performs basic mathematical operations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { 
            type: 'string', 
            enum: ['add', 'subtract', 'multiply', 'divide'],
            description: 'Mathematical operation to perform'
          },
          a: { type: 'number', description: 'First operand' },
          b: { type: 'number', description: 'Second operand' }
        },
        required: ['operation', 'a', 'b']
      }
    }
  ],
  resources: [
    {
      uri: 'sample://config',
      name: 'Server Configuration',
      description: 'Current server configuration and status',
      mimeType: 'application/json'
    },
    {
      uri: 'sample://status',
      name: 'Server Status',
      description: 'Runtime status and metrics',
      mimeType: 'application/json'
    }
  ],
  prompts: [
    {
      name: 'greeting',
      description: 'Generate a friendly greeting',
      arguments: [
        {
          name: 'name',
          description: 'Name of the person to greet',
          required: false
        }
      ]
    },
    {
      name: 'code_review',
      description: 'Review and provide feedback on code',
      arguments: [
        {
          name: 'code',
          description: 'Code to review',
          required: true
        }
      ]
    }
  ]
};
