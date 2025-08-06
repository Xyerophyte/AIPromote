# MCP (Model Context Protocol) Infrastructure

This directory contains the base infrastructure for implementing MCP servers in the AIPromote backend.

## Overview

The Model Context Protocol (MCP) is a standardized protocol that enables AI assistants and applications to securely connect to data sources and tools. This implementation provides a robust foundation for creating MCP servers that can expose various functionalities as tools, resources, and prompts.

## Directory Structure

```
src/mcp/
├── base/
│   └── MCPServer.ts          # Abstract base class for MCP servers
├── types/
│   └── index.ts              # TypeScript definitions for MCP
├── utils/
│   └── index.ts              # Utility functions and helpers
├── examples/
│   └── SampleMCPServer.ts    # Example implementation
├── index.ts                  # Main module exports
└── README.md                 # This file
```

## Key Components

### 1. MCPServer Base Class (`base/MCPServer.ts`)

The abstract base class that all MCP servers should extend. Provides:

- **Protocol Implementation**: Handles MCP protocol messages and routing
- **Tool Management**: Registration and execution of tools
- **Resource Management**: Access to server resources
- **Prompt Management**: Dynamic prompt generation
- **Metrics & Monitoring**: Request tracking and performance metrics
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Standardized error responses

### 2. Type Definitions (`types/index.ts`)

Comprehensive TypeScript types for:

- **MCPToolDefinition**: Schema for defining tools
- **MCPToolResponse**: Standardized tool responses
- **MCPServerConfig**: Server configuration interface
- **MCPRequest/Response**: Protocol message types
- **Error Codes**: Standard MCP error codes

### 3. Utility Functions (`utils/index.ts`)

Helper functions including:

- **MCPUtils.createResponse()**: Create standard responses
- **MCPUtils.validateToolArguments()**: Input validation
- **MCPUtils.sanitizeArguments()**: Security sanitization
- **MCPUtils.measureExecutionTime()**: Performance monitoring
- **Rate limiting utilities**
- **Logging helpers**

## Usage

### 1. Creating a New MCP Server

```typescript
import { MCPServer, MCPServerConfig, MCPToolResponse, MCPToolExecutionContext } from '../mcp';

class MyMCPServer extends MCPServer {
  protected async onInitialize(params: MCPInitializeParams): Promise<void> {
    // Custom initialization logic
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup logic
  }

  protected async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResponse> {
    // Tool execution logic
    switch (toolName) {
      case 'my_tool':
        return this.handleMyTool(args);
      default:
        return MCPUtils.createToolErrorResponse(`Unknown tool: ${toolName}`);
    }
  }

  protected async readResource(uri: string): Promise<{ contents: any; mimeType?: string }> {
    // Resource reading logic
  }

  protected async getPrompt(name: string, args?: Record<string, any>): Promise<{ messages: any[] }> {
    // Prompt generation logic
  }
}
```

### 2. Server Configuration

Configure your server in `src/config/mcp.config.ts`:

```typescript
export const myServerConfig: MCPServerConfig = {
  name: 'My MCP Server',
  version: '1.0.0',
  description: 'Description of my server',
  tools: [
    {
      name: 'my_tool',
      description: 'What my tool does',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
          param2: { type: 'number' }
        },
        required: ['param1']
      }
    }
  ]
};
```

### 3. Tool Implementation

```typescript
private async handleMyTool(args: Record<string, any>): Promise<MCPToolResponse> {
  try {
    const result = await this.performSomeOperation(args);
    return MCPUtils.createToolResponse(result);
  } catch (error) {
    return MCPUtils.createToolErrorResponse(error.message);
  }
}
```

## Configuration

MCP servers are configured in `src/config/mcp.config.ts`. The configuration includes:

- **Server definitions**: Each server's metadata and capabilities
- **Tool definitions**: Available tools and their schemas
- **Transport settings**: How the server communicates (SSE, WebSocket, stdio)
- **Security settings**: Rate limiting, authentication, CORS
- **Performance settings**: Timeouts, concurrency limits

## Environment Variables

Configure MCP behavior using environment variables:

```bash
# Enable/disable MCP servers
MCP_ENABLED=true

# Transport configuration
MCP_PORT=3001
MCP_TRANSPORT_TYPE=sse

# Security
MCP_AUTH_REQUIRED=false
MCP_API_KEYS=key1,key2,key3
MCP_MAX_REQUESTS_PER_MINUTE=100

# Performance
MCP_REQUEST_TIMEOUT=30000
MCP_LOG_LEVEL=info
```

## Available Servers

The default configuration includes three pre-configured servers:

1. **AI Strategy Server** (`ai-strategy`): Tools for audience analysis and content strategy
2. **Content Generator Server** (`content-generator`): Tools for content creation and optimization  
3. **Analytics Server** (`analytics`): Tools for performance analysis and reporting

## Security Features

- **Input Validation**: All tool arguments are validated against schemas
- **Sanitization**: Automatic sanitization of user inputs
- **Rate Limiting**: Configurable per-client rate limiting
- **Authentication**: Optional API key authentication
- **CORS Protection**: Configurable cross-origin restrictions

## Monitoring & Metrics

Each server tracks:

- Request count and error rate
- Average response time
- Tool usage statistics
- Uptime and health status
- Memory and performance metrics

## Error Handling

Standardized error responses with proper HTTP status codes:

- **Parse Errors**: Invalid JSON or malformed requests
- **Invalid Requests**: Missing required fields
- **Method Not Found**: Unknown MCP methods
- **Invalid Params**: Parameter validation failures
- **Internal Errors**: Server-side exceptions

## Example Server

See `examples/SampleMCPServer.ts` for a complete working example that demonstrates:

- Basic tool implementation
- Resource access
- Prompt handling
- Error handling
- Configuration setup

## Integration Points

MCP servers integrate with:

- **Frontend**: Via Server-Sent Events or WebSocket connections
- **AI Services**: Direct tool calls from AI assistants
- **Analytics**: Performance monitoring and usage tracking
- **Database**: Access to application data and services

## Development Tips

1. **Always validate inputs**: Use the provided validation utilities
2. **Handle errors gracefully**: Return proper error responses
3. **Log important events**: Use MCPUtils.log() for consistent logging  
4. **Test thoroughly**: Test all tool paths and edge cases
5. **Monitor performance**: Use the built-in metrics collection
6. **Follow naming conventions**: Use descriptive tool and resource names

## Future Enhancements

Planned improvements include:

- WebSocket transport support
- Advanced caching mechanisms
- Tool composition and chaining
- Enhanced security features
- Performance optimizations
- Developer tooling and debugging aids
