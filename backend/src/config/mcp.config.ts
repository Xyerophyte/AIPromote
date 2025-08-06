import { MCPServerConfig } from '../mcp/types';

/**
 * MCP Server Configuration
 * Central configuration for all MCP servers in the application
 */

export interface MCPGlobalConfig {
  enabled: boolean;
  servers: {
    [key: string]: MCPServerConfig;
  };
  transport: {
    type: 'stdio' | 'sse' | 'websocket';
    port?: number;
    endpoint?: string;
  };
  security: {
    rateLimiting: {
      enabled: boolean;
      maxRequestsPerMinute: number;
      maxRequestsPerHour: number;
    };
    authentication: {
      required: boolean;
      apiKeys?: string[];
    };
    cors: {
      enabled: boolean;
      allowedOrigins: string[];
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    metricsRetentionDays: number;
  };
  performance: {
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
    healthCheckIntervalMs: number;
  };
}

// Default MCP configuration
export const defaultMCPConfig: MCPGlobalConfig = {
  enabled: process.env.NODE_ENV !== 'production', // Disable in production by default
  
  servers: {
    // AI Strategy MCP Server
    'ai-strategy': {
      name: 'AIPromote AI Strategy Server',
      version: '1.0.0',
      description: 'MCP server for AI-powered social media strategy tools',
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
          name: 'analyze_audience',
          description: 'Analyzes target audience demographics and interests',
          inputSchema: {
            type: 'object',
            properties: {
              platform: { type: 'string', enum: ['linkedin', 'twitter', 'instagram'] },
              industry: { type: 'string' },
              targetKeywords: { type: 'array', items: { type: 'string' } }
            },
            required: ['platform', 'industry']
          }
        },
        {
          name: 'generate_content_strategy',
          description: 'Generates a comprehensive content strategy',
          inputSchema: {
            type: 'object',
            properties: {
              brand: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              timeframe: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } }
            },
            required: ['brand', 'goals', 'timeframe']
          }
        },
        {
          name: 'optimize_posting_schedule',
          description: 'Optimizes content posting schedule based on audience analytics',
          inputSchema: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              timezone: { type: 'string' },
              contentTypes: { type: 'array', items: { type: 'string' } }
            },
            required: ['platform', 'timezone']
          }
        }
      ]
    },

    // Content Generation MCP Server
    'content-generator': {
      name: 'AIPromote Content Generator Server',
      version: '1.0.0',
      description: 'MCP server for AI-powered content generation tools',
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
          name: 'generate_post',
          description: 'Generates social media post content',
          inputSchema: {
            type: 'object',
            properties: {
              platform: { type: 'string', enum: ['linkedin', 'twitter', 'instagram'] },
              topic: { type: 'string' },
              tone: { type: 'string', enum: ['professional', 'casual', 'humorous', 'inspiring'] },
              length: { type: 'string', enum: ['short', 'medium', 'long'] },
              hashtags: { type: 'boolean' },
              callToAction: { type: 'boolean' }
            },
            required: ['platform', 'topic', 'tone']
          }
        },
        {
          name: 'generate_hashtags',
          description: 'Generates relevant hashtags for content',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              platform: { type: 'string' },
              industry: { type: 'string' },
              maxCount: { type: 'number', minimum: 1, maximum: 30 }
            },
            required: ['content', 'platform']
          }
        },
        {
          name: 'rewrite_content',
          description: 'Rewrites content for different platforms or tones',
          inputSchema: {
            type: 'object',
            properties: {
              originalContent: { type: 'string' },
              targetPlatform: { type: 'string' },
              targetTone: { type: 'string' },
              targetLength: { type: 'string' }
            },
            required: ['originalContent', 'targetPlatform']
          }
        }
      ]
    },

    // Analytics MCP Server
    'analytics': {
      name: 'AIPromote Analytics Server',
      version: '1.0.0',
      description: 'MCP server for social media analytics and reporting tools',
      author: 'AIPromote Team',
      license: 'MIT',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        prompts: { listChanged: true },
        logging: {}
      },
      tools: [
        {
          name: 'analyze_performance',
          description: 'Analyzes social media post performance',
          inputSchema: {
            type: 'object',
            properties: {
              postIds: { type: 'array', items: { type: 'string' } },
              platform: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date' },
                  end: { type: 'string', format: 'date' }
                },
                required: ['start', 'end']
              }
            },
            required: ['platform', 'dateRange']
          }
        },
        {
          name: 'generate_report',
          description: 'Generates comprehensive analytics reports',
          inputSchema: {
            type: 'object',
            properties: {
              reportType: { type: 'string', enum: ['weekly', 'monthly', 'quarterly', 'custom'] },
              platforms: { type: 'array', items: { type: 'string' } },
              includeCompetitorAnalysis: { type: 'boolean' },
              format: { type: 'string', enum: ['pdf', 'html', 'json'] }
            },
            required: ['reportType', 'platforms']
          }
        },
        {
          name: 'track_trends',
          description: 'Tracks trending topics and hashtags',
          inputSchema: {
            type: 'object',
            properties: {
              keywords: { type: 'array', items: { type: 'string' } },
              platforms: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              timeframe: { type: 'string', enum: ['1h', '24h', '7d', '30d'] }
            },
            required: ['platforms', 'timeframe']
          }
        }
      ],
      resources: [
        {
          uri: 'analytics://reports/latest',
          name: 'Latest Analytics Report',
          description: 'Access to the most recent analytics report',
          mimeType: 'application/json'
        },
        {
          uri: 'analytics://metrics/realtime',
          name: 'Real-time Metrics',
          description: 'Live social media metrics and KPIs',
          mimeType: 'application/json'
        }
      ]
    }
  },

  transport: {
    type: 'sse', // Server-Sent Events for web integration
    port: 3001,
    endpoint: '/mcp'
  },

  security: {
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 100,
      maxRequestsPerHour: 1000
    },
    authentication: {
      required: process.env.NODE_ENV === 'production',
      apiKeys: process.env.MCP_API_KEYS?.split(',') || []
    },
    cors: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000', // Frontend dev server
        'https://aipromote.app', // Production frontend
        ...(process.env.MCP_ALLOWED_ORIGINS?.split(',') || [])
      ]
    }
  },

  logging: {
    level: (process.env.MCP_LOG_LEVEL as any) || 'info',
    enableMetrics: true,
    metricsRetentionDays: 30
  },

  performance: {
    maxConcurrentRequests: 50,
    requestTimeoutMs: 30000, // 30 seconds
    healthCheckIntervalMs: 60000 // 1 minute
  }
};

/**
 * Gets MCP configuration with environment variable overrides
 */
export function getMCPConfig(): MCPGlobalConfig {
  const config = { ...defaultMCPConfig };

  // Environment variable overrides
  if (process.env.MCP_ENABLED === 'false') {
    config.enabled = false;
  }

  if (process.env.MCP_PORT) {
    config.transport.port = parseInt(process.env.MCP_PORT, 10);
  }

  if (process.env.MCP_TRANSPORT_TYPE) {
    config.transport.type = process.env.MCP_TRANSPORT_TYPE as any;
  }

  if (process.env.MCP_MAX_REQUESTS_PER_MINUTE) {
    config.security.rateLimiting.maxRequestsPerMinute = parseInt(process.env.MCP_MAX_REQUESTS_PER_MINUTE, 10);
  }

  if (process.env.MCP_AUTH_REQUIRED === 'true') {
    config.security.authentication.required = true;
  }

  if (process.env.MCP_REQUEST_TIMEOUT) {
    config.performance.requestTimeoutMs = parseInt(process.env.MCP_REQUEST_TIMEOUT, 10);
  }

  return config;
}

/**
 * Validates MCP configuration
 */
export function validateMCPConfig(config: MCPGlobalConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate transport configuration
  if (config.transport.type === 'sse' || config.transport.type === 'websocket') {
    if (!config.transport.port || config.transport.port < 1 || config.transport.port > 65535) {
      errors.push('Invalid transport port number');
    }
  }

  // Validate server configurations
  for (const [serverId, serverConfig] of Object.entries(config.servers)) {
    if (!serverConfig.name || !serverConfig.version) {
      errors.push(`Server ${serverId} missing required name or version`);
    }

    // Validate tools
    if (serverConfig.tools) {
      for (const tool of serverConfig.tools) {
        if (!tool.name || !tool.description || !tool.inputSchema) {
          errors.push(`Invalid tool definition in server ${serverId}: ${tool.name || 'unnamed'}`);
        }
      }
    }
  }

  // Validate security settings
  if (config.security.rateLimiting.maxRequestsPerMinute < 1) {
    errors.push('Rate limiting max requests per minute must be positive');
  }

  if (config.security.authentication.required && (!config.security.authentication.apiKeys || config.security.authentication.apiKeys.length === 0)) {
    errors.push('Authentication is required but no API keys are configured');
  }

  // Validate performance settings
  if (config.performance.maxConcurrentRequests < 1) {
    errors.push('Max concurrent requests must be positive');
  }

  if (config.performance.requestTimeoutMs < 1000) {
    errors.push('Request timeout must be at least 1000ms');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Gets a specific server configuration
 */
export function getServerConfig(serverId: string): MCPServerConfig | null {
  const config = getMCPConfig();
  return config.servers[serverId] || null;
}

/**
 * Lists all available MCP servers
 */
export function listAvailableServers(): string[] {
  const config = getMCPConfig();
  return Object.keys(config.servers);
}
