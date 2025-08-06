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

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export { config };
