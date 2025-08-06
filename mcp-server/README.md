# AI Promote MCP Server

This directory contains the Model Context Protocol (MCP) server implementation for the AI Promote project.

## Overview

The MCP server provides AI assistants with structured access to project information, file system operations, and development workflow integration.

## Dependencies Installed

### Core MCP Packages
- **@modelcontextprotocol/sdk** (v1.17.1) - Core MCP SDK for TypeScript
- **@modelcontextprotocol/server-filesystem** (v2025.7.29) - File system operations MCP server

### Development Dependencies
- **zod** (v3.25.76) - TypeScript-first schema validation
- **typescript** (v5.9.2) - TypeScript compiler
- **@types/node** (v20.19.9) - Node.js type definitions  
- **ts-node** (v10.9.2) - TypeScript execution environment

## Features

### Tools
- `get_project_info` - Analyze project structure and configuration

### Resources
- `project://structure` - Project structure documentation

## Available Scripts

From the root directory, you can run:

- `npm run mcp:dev` - Start MCP server in development mode with ts-node
- `npm run mcp:build` - Compile TypeScript to JavaScript
- `npm run mcp:start` - Start compiled MCP server
- `npm run mcp:type-check` - Type check without compilation
- `npm run mcp:install` - Install MCP server dependencies

## Usage

### Development Mode
```bash
npm run mcp:dev
```

### Production Build
```bash
npm run mcp:build
npm run mcp:start
```

## Architecture

The MCP server follows the Model Context Protocol specification and provides:

1. **Server Capabilities**
   - Tool execution
   - Resource access
   - Schema validation

2. **Transport Layer**
   - stdio-based communication
   - JSON-RPC protocol

3. **Integration Points**
   - Project structure analysis
   - File system operations
   - Development workflow support

## Extension Points

The server can be extended with additional:
- Database integration (PostgreSQL via adapted SQLite patterns)
- Build system integration
- Testing framework integration
- Deployment workflow tools

## Notes

- The server uses stdio transport for communication with AI clients
- All operations are validated using Zod schemas
- TypeScript provides full type safety throughout the implementation
- The server integrates with the existing AI Promote monorepo structure
