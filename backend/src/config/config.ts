import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  logLevel: string;
  corsOrigins: string[];
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  ai: {
    openai: {
      apiKey: string;
      model: string;
    };
    anthropic: {
      apiKey: string;
      model: string;
    };
  };
  social: {
    twitter: {
      apiKey: string;
      apiSecret: string;
      bearerToken: string;
      clientId: string;
      clientSecret: string;
    };
    linkedin: {
      clientId: string;
      clientSecret: string;
    };
    facebook: {
      appId: string;
      appSecret: string;
    };
    buffer: {
      clientId: string;
      clientSecret: string;
    };
    hootsuite: {
      clientId: string;
      clientSecret: string;
    };
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  webhooks: {
    secret: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    priceIds: {
      starter: string;
      growth: string;
      scale: string;
    };
  };
  billing: {
    trialPeriodDays: number;
    portalReturnUrl: string;
    checkoutSuccessUrl: string;
    checkoutCancelUrl: string;
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'],
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/aipromotdb'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
    }
  },
  
  social: {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || ''
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || ''
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || ''
    },
    buffer: {
      clientId: process.env.BUFFER_CLIENT_ID || '',
      clientSecret: process.env.BUFFER_CLIENT_SECRET || ''
    },
    hootsuite: {
      clientId: process.env.HOOTSUITE_CLIENT_ID || '',
      clientSecret: process.env.HOOTSUITE_CLIENT_SECRET || ''
    }
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-char-secret-encryption-key',
    algorithm: 'aes-256-gcm'
  },
  
  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret-key'
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceIds: {
      starter: process.env.STRIPE_STARTER_PRICE_ID || '',
      growth: process.env.STRIPE_GROWTH_PRICE_ID || '',
      scale: process.env.STRIPE_SCALE_PRICE_ID || ''
    }
  },
  
  billing: {
    trialPeriodDays: parseInt(process.env.TRIAL_PERIOD_DAYS || '14', 10),
    portalReturnUrl: process.env.BILLING_PORTAL_RETURN_URL || 'http://localhost:3000/billing',
    checkoutSuccessUrl: process.env.CHECKOUT_SUCCESS_URL || 'http://localhost:3000/billing/success',
    checkoutCancelUrl: process.env.CHECKOUT_CANCEL_URL || 'http://localhost:3000/billing/cancel'
  }
};

/**
 * Environment variable validation
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables for all environments
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  // Additional required variables for production
  const productionRequiredVars = [
    'REDIS_URL',
    'ENCRYPTION_KEY',
    'NEXTAUTH_SECRET',
    'WEBHOOK_SECRET'
  ];

  // Security-critical variables that should be strong
  const securityVars = {
    JWT_SECRET: { minLength: 32, description: 'JWT secret' },
    NEXTAUTH_SECRET: { minLength: 32, description: 'NextAuth secret' },
    ENCRYPTION_KEY: { minLength: 32, description: 'Encryption key' },
    WEBHOOK_SECRET: { minLength: 16, description: 'Webhook secret' }
  };

  // Default/weak values that should be changed in production
  const weakDefaults = {
    JWT_SECRET: ['your-super-secret-jwt-key-change-in-production', 'secret', 'jwt-secret'],
    NEXTAUTH_SECRET: ['your-nextauth-secret-change-in-production', 'nextauth-secret'],
    ENCRYPTION_KEY: ['your-32-char-secret-encryption-key']
  };

  // Check required variables
  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check production-specific requirements
  if (config.nodeEnv === 'production') {
    for (const envVar of productionRequiredVars) {
      if (!process.env[envVar]) {
        errors.push(`Missing required production environment variable: ${envVar}`);
      }
    }

    // Check for weak/default secrets in production
    for (const [varName, weakValues] of Object.entries(weakDefaults)) {
      const value = process.env[varName];
      if (value && weakValues.includes(value)) {
        errors.push(`Production environment variable ${varName} is using a weak/default value. Please generate a secure secret.`);
      }
    }
  }

  // Validate security variable strength
  for (const [varName, requirements] of Object.entries(securityVars)) {
    const value = process.env[varName];
    if (value) {
      if (value.length < requirements.minLength) {
        errors.push(`${requirements.description} (${varName}) must be at least ${requirements.minLength} characters long`);
      }
      
      // Check for basic entropy (not just repeated characters)
      const uniqueChars = new Set(value).size;
      if (uniqueChars < Math.min(8, requirements.minLength / 4)) {
        warnings.push(`${requirements.description} (${varName}) appears to have low entropy. Consider using a more random value.`);
      }
    }
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    warnings.push('DATABASE_URL should start with postgresql:// for PostgreSQL connections');
  }

  // Validate Redis URL format
  if (process.env.REDIS_URL) {
    if (!process.env.REDIS_URL.startsWith('redis://') && !process.env.REDIS_URL.startsWith('rediss://')) {
      warnings.push('REDIS_URL should start with redis:// or rediss:// for secure connections');
    }
  }

  // Check CORS origins in production
  if (config.nodeEnv === 'production') {
    const corsOrigins = process.env.CORS_ORIGINS;
    if (!corsOrigins || corsOrigins.includes('localhost')) {
      warnings.push('CORS_ORIGINS contains localhost in production. Ensure production domains are configured.');
    }
  }

  // Validate JWT expiration times
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  if (config.nodeEnv === 'production') {
    if (jwtExpiresIn.includes('d') && parseInt(jwtExpiresIn) > 1) {
      warnings.push('JWT access token expiration is longer than 1 day in production. Consider shorter expiration for security.');
    }
  }

  // Check encryption key format (should be hex for AES-256)
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length === 64) {
    // Check if it's valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      warnings.push('ENCRYPTION_KEY should be 64 characters of hexadecimal for AES-256-GCM encryption');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Perform validation
const validation = validateEnvironmentVariables();

// Handle validation results
if (!validation.valid) {
  console.error('❌ Environment variable validation failed:');
  validation.errors.forEach(error => console.error(`  • ${error}`));
  
  if (config.nodeEnv === 'production') {
    process.exit(1); // Exit in production if validation fails
  } else {
    console.warn('⚠️  Application will continue in development mode, but these issues should be fixed before production.');
  }
}

// Display warnings
if (validation.warnings.length > 0) {
  console.warn('⚠️  Environment variable warnings:');
  validation.warnings.forEach(warning => console.warn(`  • ${warning}`));
}

export { config };
