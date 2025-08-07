#!/bin/bash

# Production Redis Setup Script for Upstash
# This script helps you set up and configure Redis for caching, sessions, rate limiting, and job queues

set -e

echo "🚀 Setting up Production Redis with Upstash..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to create Upstash Redis database
create_upstash_redis() {
    echo -e "${YELLOW}Setting up Upstash Redis database...${NC}"
    echo "Please follow these steps manually:"
    echo "1. Go to https://console.upstash.com"
    echo "2. Sign up/Login to your account"
    echo "3. Click 'Create Database'"
    echo "4. Choose database settings:"
    echo "   - Name: aipromotdb-redis-prod"
    echo "   - Region: Choose closest to your users"
    echo "   - Type: Regional (recommended for production)"
    echo "   - Eviction Policy: allkeys-lru (for caching)"
    echo "5. Click 'Create Database'"
    echo ""
    echo "After creation, get the following from the database details:"
    echo "- Endpoint"
    echo "- Port"
    echo "- Password"
    echo "- REST URL"
    echo "- REST Token"
    echo ""
    read -p "Press Enter when you have created the Redis database and gathered the credentials..."
}

# Function to test Redis connection
test_redis_connection() {
    echo -e "${BLUE}Testing Redis connection...${NC}"
    
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}Error: .env.production file not found${NC}"
        echo "Please create .env.production with your Redis credentials"
        exit 1
    fi
    
    # Load environment variables
    source .env.production
    
    if [ -z "$REDIS_URL" ]; then
        echo -e "${RED}Error: REDIS_URL not set in .env.production${NC}"
        exit 1
    fi
    
    echo "Testing Redis connection with Node.js..."
    
    # Create test script
    cat > test-redis.js << 'EOF'
const Redis = require('ioredis');

async function testRedis() {
    const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true
    });
    
    try {
        console.log('Connecting to Redis...');
        await redis.connect();
        
        console.log('Testing basic operations...');
        await redis.set('test:key', 'Hello from production setup!');
        const value = await redis.get('test:key');
        console.log('Test value:', value);
        
        console.log('Testing expiration...');
        await redis.setex('test:expire', 5, 'This will expire in 5 seconds');
        
        console.log('Testing hash operations...');
        await redis.hset('test:hash', 'field1', 'value1', 'field2', 'value2');
        const hash = await redis.hgetall('test:hash');
        console.log('Hash data:', hash);
        
        console.log('Cleaning up...');
        await redis.del('test:key', 'test:expire', 'test:hash');
        
        console.log('✅ Redis connection test successful!');
        await redis.quit();
    } catch (error) {
        console.error('❌ Redis connection test failed:', error);
        process.exit(1);
    }
}

testRedis();
EOF

    # Run test
    cd backend
    node ../test-redis.js
    cd ..
    
    # Clean up
    rm test-redis.js
    
    echo -e "${GREEN}Redis connection test completed successfully!${NC}"
}

# Function to setup caching configuration
setup_caching() {
    echo -e "${BLUE}Setting up Redis caching configuration...${NC}"
    
    # Create cache utility
    cat > backend/src/utils/cache.ts << 'EOF'
import Redis from 'ioredis';

class CacheService {
    private redis: Redis;
    
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL!, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            lazyConnect: true,
        });
        
        this.redis.on('error', (error) => {
            console.error('Redis connection error:', error);
        });
        
        this.redis.on('connect', () => {
            console.log('Redis cache connected');
        });
    }
    
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serialized);
            } else {
                await this.redis.set(key, serialized);
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }
    
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }
    
    // Pattern-based operations
    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.redis.keys(pattern);
        } catch (error) {
            console.error('Cache keys error:', error);
            return [];
        }
    }
    
    async deleteByPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache delete by pattern error:', error);
        }
    }
    
    // Hash operations for complex data
    async hset(key: string, field: string, value: any): Promise<void> {
        try {
            await this.redis.hset(key, field, JSON.stringify(value));
        } catch (error) {
            console.error('Cache hset error:', error);
        }
    }
    
    async hget<T>(key: string, field: string): Promise<T | null> {
        try {
            const value = await this.redis.hget(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache hget error:', error);
            return null;
        }
    }
    
    async hdel(key: string, ...fields: string[]): Promise<void> {
        try {
            await this.redis.hdel(key, ...fields);
        } catch (error) {
            console.error('Cache hdel error:', error);
        }
    }
    
    // Increment operations for counters
    async incr(key: string): Promise<number> {
        try {
            return await this.redis.incr(key);
        } catch (error) {
            console.error('Cache incr error:', error);
            return 0;
        }
    }
    
    async incrby(key: string, increment: number): Promise<number> {
        try {
            return await this.redis.incrby(key, increment);
        } catch (error) {
            console.error('Cache incrby error:', error);
            return 0;
        }
    }
    
    // List operations for queues
    async lpush(key: string, ...values: any[]): Promise<number> {
        try {
            const serialized = values.map(v => JSON.stringify(v));
            return await this.redis.lpush(key, ...serialized);
        } catch (error) {
            console.error('Cache lpush error:', error);
            return 0;
        }
    }
    
    async rpop<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.rpop(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache rpop error:', error);
            return null;
        }
    }
    
    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}

export const cache = new CacheService();
EOF

    echo -e "${GREEN}Cache utility created!${NC}"
}

# Function to setup session storage
setup_session_storage() {
    echo -e "${BLUE}Setting up Redis session storage...${NC}"
    
    cat > backend/src/utils/session.ts << 'EOF'
import Redis from 'ioredis';

class SessionStore {
    private redis: Redis;
    
    constructor() {
        this.redis = new Redis(process.env.SESSION_REDIS_URL || process.env.REDIS_URL!, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            lazyConnect: true,
        });
        
        this.redis.on('error', (error) => {
            console.error('Session Redis connection error:', error);
        });
    }
    
    private getKey(sessionId: string): string {
        return `session:${sessionId}`;
    }
    
    async get(sessionId: string): Promise<any | null> {
        try {
            const data = await this.redis.get(this.getKey(sessionId));
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Session get error:', error);
            return null;
        }
    }
    
    async set(sessionId: string, sessionData: any, maxAge?: number): Promise<void> {
        try {
            const key = this.getKey(sessionId);
            const data = JSON.stringify(sessionData);
            
            if (maxAge) {
                await this.redis.setex(key, Math.ceil(maxAge / 1000), data);
            } else {
                await this.redis.set(key, data);
            }
        } catch (error) {
            console.error('Session set error:', error);
        }
    }
    
    async destroy(sessionId: string): Promise<void> {
        try {
            await this.redis.del(this.getKey(sessionId));
        } catch (error) {
            console.error('Session destroy error:', error);
        }
    }
    
    async touch(sessionId: string, maxAge: number): Promise<void> {
        try {
            await this.redis.expire(this.getKey(sessionId), Math.ceil(maxAge / 1000));
        } catch (error) {
            console.error('Session touch error:', error);
        }
    }
    
    async all(): Promise<any[]> {
        try {
            const keys = await this.redis.keys('session:*');
            if (keys.length === 0) return [];
            
            const sessions = await this.redis.mget(...keys);
            return sessions
                .filter(session => session !== null)
                .map(session => JSON.parse(session!));
        } catch (error) {
            console.error('Session all error:', error);
            return [];
        }
    }
    
    async length(): Promise<number> {
        try {
            const keys = await this.redis.keys('session:*');
            return keys.length;
        } catch (error) {
            console.error('Session length error:', error);
            return 0;
        }
    }
    
    async clear(): Promise<void> {
        try {
            const keys = await this.redis.keys('session:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Session clear error:', error);
        }
    }
}

export const sessionStore = new SessionStore();
EOF

    echo -e "${GREEN}Session storage utility created!${NC}"
}

# Function to setup rate limiting
setup_rate_limiting() {
    echo -e "${BLUE}Setting up Redis rate limiting...${NC}"
    
    cat > backend/src/utils/rateLimiter.ts << 'EOF'
import Redis from 'ioredis';

class RateLimiter {
    private redis: Redis;
    
    constructor() {
        this.redis = new Redis(process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL!, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            lazyConnect: true,
        });
        
        this.redis.on('error', (error) => {
            console.error('Rate limiter Redis connection error:', error);
        });
    }
    
    private getKey(identifier: string, action: string): string {
        return `ratelimit:${action}:${identifier}`;
    }
    
    async isAllowed(
        identifier: string,
        action: string,
        maxRequests: number,
        windowMs: number
    ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        try {
            const key = this.getKey(identifier, action);
            const windowSeconds = Math.ceil(windowMs / 1000);
            
            // Use Lua script for atomic operation
            const luaScript = `
                local key = KEYS[1]
                local max = tonumber(ARGV[1])
                local window = tonumber(ARGV[2])
                local now = tonumber(ARGV[3])
                
                local current = redis.call('GET', key)
                
                if current == false then
                    redis.call('SETEX', key, window, 1)
                    return {1, max - 1, now + (window * 1000)}
                end
                
                current = tonumber(current)
                
                if current < max then
                    local remaining = redis.call('INCR', key)
                    local ttl = redis.call('TTL', key)
                    return {1, max - remaining, now + (ttl * 1000)}
                else
                    local ttl = redis.call('TTL', key)
                    return {0, 0, now + (ttl * 1000)}
                end
            `;
            
            const result = await this.redis.eval(
                luaScript,
                1,
                key,
                maxRequests.toString(),
                windowSeconds.toString(),
                Date.now().toString()
            ) as [number, number, number];
            
            return {
                allowed: result[0] === 1,
                remaining: result[1],
                resetTime: result[2]
            };
        } catch (error) {
            console.error('Rate limiter error:', error);
            // Fail open in case of Redis issues
            return {
                allowed: true,
                remaining: maxRequests - 1,
                resetTime: Date.now() + windowMs
            };
        }
    }
    
    async resetLimit(identifier: string, action: string): Promise<void> {
        try {
            const key = this.getKey(identifier, action);
            await this.redis.del(key);
        } catch (error) {
            console.error('Rate limiter reset error:', error);
        }
    }
    
    async getRemainingRequests(
        identifier: string,
        action: string,
        maxRequests: number
    ): Promise<number> {
        try {
            const key = this.getKey(identifier, action);
            const current = await this.redis.get(key);
            
            if (!current) {
                return maxRequests;
            }
            
            return Math.max(0, maxRequests - parseInt(current));
        } catch (error) {
            console.error('Rate limiter get remaining error:', error);
            return maxRequests;
        }
    }
}

export const rateLimiter = new RateLimiter();
EOF

    echo -e "${GREEN}Rate limiter utility created!${NC}"
}

# Function to setup BullMQ job queues
setup_job_queues() {
    echo -e "${BLUE}Setting up BullMQ job queues...${NC}"
    
    cat > backend/src/utils/queues.ts << 'EOF'
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Redis connection for queues
const redisConnection = new Redis(process.env.QUEUE_REDIS_URL || process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
});

// Queue configurations
const queueConfig = {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3'),
        backoff: {
            type: 'exponential',
            delay: parseInt(process.env.QUEUE_DELAY_BETWEEN_ATTEMPTS || '5000'),
        },
    },
};

// Job Queues
export const aiGenerationQueue = new Queue('ai-generation', queueConfig);
export const socialPostingQueue = new Queue('social-posting', queueConfig);
export const analyticsQueue = new Queue('analytics', queueConfig);
export const emailQueue = new Queue('email', queueConfig);

// Job processors
export const createAIGenerationWorker = () => {
    return new Worker(
        'ai-generation',
        async (job) => {
            const { type, data } = job.data;
            
            switch (type) {
                case 'generate-strategy':
                    // Import and run strategy generation
                    const { generateStrategy } = await import('../services/aiService');
                    return await generateStrategy(data);
                
                case 'generate-content':
                    // Import and run content generation
                    const { generateContent } = await import('../services/contentService');
                    return await generateContent(data);
                
                default:
                    throw new Error(`Unknown AI generation job type: ${type}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        }
    );
};

export const createSocialPostingWorker = () => {
    return new Worker(
        'social-posting',
        async (job) => {
            const { platform, data } = job.data;
            
            // Import and run social posting
            const { postToSocialMedia } = await import('../services/socialService');
            return await postToSocialMedia(platform, data);
        },
        {
            connection: redisConnection,
            concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        }
    );
};

export const createAnalyticsWorker = () => {
    return new Worker(
        'analytics',
        async (job) => {
            const { type, data } = job.data;
            
            switch (type) {
                case 'collect-metrics':
                    const { collectMetrics } = await import('../services/analyticsService');
                    return await collectMetrics(data);
                
                case 'generate-report':
                    const { generateReport } = await import('../services/reportService');
                    return await generateReport(data);
                
                default:
                    throw new Error(`Unknown analytics job type: ${type}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        }
    );
};

export const createEmailWorker = () => {
    return new Worker(
        'email',
        async (job) => {
            const { type, data } = job.data;
            
            // Import and run email service
            const { sendEmail } = await import('../services/emailService');
            return await sendEmail(type, data);
        },
        {
            connection: redisConnection,
            concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
        }
    );
};

// Queue events for monitoring
export const setupQueueEvents = () => {
    const queues = [
        { name: 'ai-generation', queue: aiGenerationQueue },
        { name: 'social-posting', queue: socialPostingQueue },
        { name: 'analytics', queue: analyticsQueue },
        { name: 'email', queue: emailQueue },
    ];
    
    queues.forEach(({ name, queue }) => {
        const queueEvents = new QueueEvents(name, { connection: redisConnection });
        
        queueEvents.on('completed', ({ jobId, returnvalue }) => {
            console.log(`Job ${jobId} in queue ${name} completed with result:`, returnvalue);
        });
        
        queueEvents.on('failed', ({ jobId, failedReason }) => {
            console.error(`Job ${jobId} in queue ${name} failed:`, failedReason);
        });
        
        queueEvents.on('progress', ({ jobId, data }) => {
            console.log(`Job ${jobId} in queue ${name} progress:`, data);
        });
    });
};

// Helper functions
export const addAIGenerationJob = async (type: string, data: any, options?: any) => {
    return await aiGenerationQueue.add(type, { type, data }, options);
};

export const addSocialPostingJob = async (platform: string, data: any, options?: any) => {
    return await socialPostingQueue.add(platform, { platform, data }, options);
};

export const addAnalyticsJob = async (type: string, data: any, options?: any) => {
    return await analyticsQueue.add(type, { type, data }, options);
};

export const addEmailJob = async (type: string, data: any, options?: any) => {
    return await emailQueue.add(type, { type, data }, options);
};

// Queue health check
export const getQueueHealth = async () => {
    const queues = [
        { name: 'ai-generation', queue: aiGenerationQueue },
        { name: 'social-posting', queue: socialPostingQueue },
        { name: 'analytics', queue: analyticsQueue },
        { name: 'email', queue: emailQueue },
    ];
    
    const health = await Promise.all(
        queues.map(async ({ name, queue }) => {
            const [waiting, active, completed, failed] = await Promise.all([
                queue.getWaiting(),
                queue.getActive(),
                queue.getCompleted(),
                queue.getFailed(),
            ]);
            
            return {
                name,
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
            };
        })
    );
    
    return health;
};
EOF

    echo -e "${GREEN}Job queue utilities created!${NC}"
}

# Function to create Redis configuration documentation
create_documentation() {
    echo -e "${BLUE}Creating Redis configuration documentation...${NC}"
    
    cat > docs/REDIS_SETUP.md << 'EOF'
# Redis Configuration for Production

This document outlines the Redis setup for production deployment with Upstash.

## Overview

Our Redis setup handles:
- **Caching**: API responses, database query results, computed data
- **Session Storage**: User sessions with automatic expiration
- **Rate Limiting**: API rate limiting and abuse prevention
- **Job Queues**: Background job processing with BullMQ

## Upstash Setup

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database with these settings:
   - **Name**: `aipromotdb-redis-prod`
   - **Region**: Choose closest to your users
   - **Type**: Regional (for production)
   - **Eviction Policy**: `allkeys-lru`

## Environment Variables

Add these to your `.env.production`:

```bash
# Redis Configuration
REDIS_URL=rediss://default:[PASSWORD]@[ENDPOINT]:6380
REDIS_TOKEN=[YOUR_REDIS_TOKEN]
REDIS_CONNECTION_POOL_SIZE=10
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000

# Session Storage
SESSION_SECRET=[GENERATE_SESSION_SECRET]
SESSION_REDIS_URL=${REDIS_URL}
SESSION_MAX_AGE=86400000
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# Rate Limiting
RATE_LIMIT_REDIS_URL=${REDIS_URL}
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Job Queues
QUEUE_REDIS_URL=${REDIS_URL}
QUEUE_CONCURRENCY=5
QUEUE_MAX_ATTEMPTS=3
QUEUE_DELAY_BETWEEN_ATTEMPTS=5000
```

## Usage Examples

### Caching
```typescript
import { cache } from '../utils/cache';

// Set cache with TTL
await cache.set('user:123', userData, 3600); // 1 hour

// Get from cache
const user = await cache.get<User>('user:123');

// Delete cache
await cache.del('user:123');
```

### Rate Limiting
```typescript
import { rateLimiter } from '../utils/rateLimiter';

const result = await rateLimiter.isAllowed(
    userId, 
    'api-call', 
    100, // max requests
    60000 // per minute
);

if (!result.allowed) {
    throw new Error('Rate limit exceeded');
}
```

### Job Queues
```typescript
import { addAIGenerationJob } from '../utils/queues';

// Add background job
await addAIGenerationJob('generate-strategy', {
    organizationId: 'org123',
    prompt: 'Generate marketing strategy'
});
```

## Monitoring

Monitor Redis performance through:
- Upstash Console dashboard
- Application logs
- Queue health endpoints: `GET /api/health/queues`

## Performance Tuning

### Connection Pooling
- Pool size: 10-20 connections
- Max retries: 3
- Retry delay: 1000ms

### Memory Management
- Use TTL for all cached data
- Implement cache invalidation strategies
- Monitor memory usage in Upstash dashboard

### Queue Optimization
- Set appropriate concurrency levels
- Use job priorities for critical tasks
- Implement proper error handling and retries

## Security

1. Use TLS connections (rediss://)
2. Rotate Redis passwords regularly
3. Implement proper authentication
4. Monitor for unusual access patterns

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check network connectivity
   - Verify Redis URL format
   - Increase retry settings

2. **Memory Limits**
   - Implement cache eviction policies
   - Add TTL to all keys
   - Monitor usage patterns

3. **Queue Backlogs**
   - Increase worker concurrency
   - Optimize job processing time
   - Add more queue workers

### Debugging Commands

```bash
# Test Redis connection
npm run test:redis

# Monitor queue health
curl https://your-api.vercel.app/api/health/queues

# Check cache statistics
curl https://your-api.vercel.app/api/health/cache
```

## Backup and Recovery

Upstash provides:
- Automatic daily backups
- Point-in-time recovery
- Cross-region replication (Pro plans)

For additional backup security:
1. Export critical data regularly
2. Implement application-level caching fallbacks
3. Use multiple Redis instances for high availability
EOF

    echo -e "${GREEN}Documentation created: docs/REDIS_SETUP.md${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}Production Redis Setup${NC}"
    echo "====================="
    
    # Create directories if they don't exist
    mkdir -p scripts backend/src/utils docs
    
    case "${1:-all}" in
        "create")
            create_upstash_redis
            ;;
        "test")
            test_redis_connection
            ;;
        "cache")
            setup_caching
            ;;
        "session")
            setup_session_storage
            ;;
        "ratelimit")
            setup_rate_limiting
            ;;
        "queues")
            setup_job_queues
            ;;
        "docs")
            create_documentation
            ;;
        "all")
            echo "Running full Redis setup..."
            create_upstash_redis
            test_redis_connection
            setup_caching
            setup_session_storage
            setup_rate_limiting
            setup_job_queues
            create_documentation
            ;;
        *)
            echo "Usage: $0 {create|test|cache|session|ratelimit|queues|docs|all}"
            echo ""
            echo "Commands:"
            echo "  create     - Instructions for creating Upstash Redis"
            echo "  test       - Test Redis connection"
            echo "  cache      - Setup caching utilities"
            echo "  session    - Setup session storage"
            echo "  ratelimit  - Setup rate limiting"
            echo "  queues     - Setup BullMQ job queues"
            echo "  docs       - Create documentation"
            echo "  all        - Run full Redis setup"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ Redis setup completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env.production with Redis credentials"
    echo "2. Test the connection using: npm run test:redis"
    echo "3. Deploy to Vercel with Redis environment variables"
    echo "4. Monitor Redis usage in Upstash console"
}

# Run main function
main "$@"
