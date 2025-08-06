#!/usr/bin/env node

/**
 * Basic MCP Server Implementation
 * This demonstrates the core MCP SDK and server-filesystem integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Create server instance
const server = new Server(
  {
    name: 'ai-promote-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define tool schemas
const GetProjectInfoToolSchema = z.object({
  name: z.literal('get_project_info'),
  arguments: z.object({
    path: z.string().optional(),
  }),
});

// Handle list tools requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_project_info',
        description: 'Get information about the AI Promote project structure',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Project path to analyze (optional)',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_project_info': {
      const projectPath = args?.path || process.cwd();
      
      return {
        content: [
          {
            type: 'text',
            text: `AI Promote Project Information:
            
Project: AI Promote - Monorepo with Next.js frontend and Fastify backend
Path: ${projectPath}
Structure:
- frontend/ (Next.js application)
- backend/ (Fastify API server) 
- shared/ (Shared utilities and types)
- mcp-server/ (Model Context Protocol server)

MCP Server Features:
- Project structure analysis
- File system operations
- Development workflow integration

Dependencies:
- @modelcontextprotocol/sdk: Core MCP SDK
- @modelcontextprotocol/server-filesystem: File system operations
- TypeScript support with Zod schemas`,
          },
        ],
      };
    }

    default:
      throw new Error(`Tool "${name}" not found`);
  }
});

// Handle list resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'project://structure',
        name: 'Project Structure',
        mimeType: 'text/plain',
        description: 'AI Promote project structure and configuration',
      },
    ],
  };
});

// Handle read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'project://structure': {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `AI Promote Project Structure:

Root/
├── frontend/          # Next.js React application
├── backend/           # Fastify Node.js API
├── shared/            # Shared utilities and types  
├── mcp-server/        # Model Context Protocol server
├── package.json       # Root package configuration
└── docker-compose.yml # Container orchestration

MCP Integration:
- SDK: @modelcontextprotocol/sdk
- File System: @modelcontextprotocol/server-filesystem
- Tools: Project analysis and development workflow
- Resources: Project documentation and structure`,
          },
        ],
      };
    }

    default:
      throw new Error(`Resource "${uri}" not found`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('AI Promote MCP Server running on stdio');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

export { server };
