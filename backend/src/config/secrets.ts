import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { config } from './config';

interface SecretConfig {
  secretName: string;
  region: string;
}

interface AppSecrets {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_BEARER_TOKEN: string;
  LINKEDIN_CLIENT_ID: string;
  LINKEDIN_CLIENT_SECRET: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  ENCRYPTION_KEY: string;
  SENTRY_DSN: string;
  WEBHOOK_SECRET: string;
}

class SecretsManager {
  private client: SecretsManagerClient;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Retrieve a secret from AWS Secrets Manager with caching
   */
  async getSecret(secretName: string): Promise<any> {
    // Check cache first
    const cached = this.cache.get(secretName);
    const expiry = this.cacheExpiry.get(secretName);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);
      
      if (!response.SecretString) {
        throw new Error(`Secret ${secretName} has no SecretString`);
      }

      const secretValue = JSON.parse(response.SecretString);
      
      // Cache the result
      this.cache.set(secretName, secretValue);
      this.cacheExpiry.set(secretName, Date.now() + this.CACHE_TTL);
      
      return secretValue;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      
      // Fallback to environment variables
      const fallbackValue = process.env[secretName];
      if (fallbackValue) {
        console.warn(`Using fallback environment variable for ${secretName}`);
        return { [secretName]: fallbackValue };
      }
      
      throw error;
    }
  }

  /**
   * Get application secrets based on environment
   */
  async getAppSecrets(): Promise<Partial<AppSecrets>> {
    const environment = config.nodeEnv;
    const secretName = `ai-promote/${environment}`;
    
    try {
      return await this.getSecret(secretName);
    } catch (error) {
      console.error('Failed to load secrets from AWS Secrets Manager:', error);
      
      // Fallback to environment variables
      return {
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        TWITTER_API_KEY: process.env.TWITTER_API_KEY,
        TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
        TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
        LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
        SENTRY_DSN: process.env.SENTRY_DSN,
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      };
    }
  }

  /**
   * Rotate a secret (for scheduled rotation)
   */
  async rotateSecret(secretName: string, newValue: any): Promise<void> {
    try {
      const { PutSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const command = new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(newValue),
      });

      await this.client.send(command);
      
      // Clear cache for rotated secret
      this.cache.delete(secretName);
      this.cacheExpiry.delete(secretName);
      
      console.log(`Secret ${secretName} rotated successfully`);
    } catch (error) {
      console.error(`Failed to rotate secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached secrets
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Health check for secrets manager connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list secrets to verify connectivity
      const { ListSecretsCommand } = await import('@aws-sdk/client-secrets-manager');
      const command = new ListSecretsCommand({ MaxResults: 1 });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Secrets Manager health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const secretsManager = new SecretsManager();

/**
 * Initialize secrets and merge with config
 */
export async function initializeSecrets(): Promise<void> {
  try {
    const secrets = await secretsManager.getAppSecrets();
    
    // Override config values with secrets
    Object.entries(secrets).forEach(([key, value]) => {
      if (value) {
        process.env[key] = String(value);
      }
    });
    
    console.log('✅ Secrets initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize secrets:', error);
    
    if (config.nodeEnv === 'production') {
      throw new Error('Cannot start application without proper secrets in production');
    }
  }
}

/**
 * Vault-style secret management for development
 */
export class VaultManager {
  private vaultData: Map<string, any> = new Map();
  
  /**
   * Store a secret in the local vault
   */
  store(key: string, value: any, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl : undefined;
    this.vaultData.set(key, { value, expiry });
  }
  
  /**
   * Retrieve a secret from the local vault
   */
  get(key: string): any {
    const item = this.vaultData.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.vaultData.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Delete a secret from the local vault
   */
  delete(key: string): boolean {
    return this.vaultData.delete(key);
  }
  
  /**
   * List all available secret keys
   */
  list(): string[] {
    return Array.from(this.vaultData.keys());
  }
  
  /**
   * Clear expired secrets
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.vaultData.entries()) {
      if (item.expiry && now > item.expiry) {
        this.vaultData.delete(key);
      }
    }
  }
}

// Export instances
export { secretsManager };
export const vault = new VaultManager();

// Environment-specific secret configurations
export const secretConfigs = {
  production: {
    secretName: 'ai-promote/production',
    region: 'us-east-1',
  },
  staging: {
    secretName: 'ai-promote/staging',
    region: 'us-east-1',
  },
  development: {
    secretName: 'ai-promote/development',
    region: 'us-east-1',
  },
} as const;

/**
 * Utility function to safely get secrets with fallback
 */
export async function getSecretValue(
  secretName: string,
  fallbackEnvVar?: string
): Promise<string | null> {
  try {
    const secrets = await secretsManager.getSecret(secretName);
    return secrets[secretName] || null;
  } catch (error) {
    if (fallbackEnvVar && process.env[fallbackEnvVar]) {
      return process.env[fallbackEnvVar];
    }
    return null;
  }
}
