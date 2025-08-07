import { createCipher, createDecipher, randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { config } from '../config/config';

/**
 * Enhanced Data Encryption Service
 * Provides AES-256-GCM encryption for sensitive data like OAuth tokens and API keys
 */

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  salt?: string;
}

interface EncryptionOptions {
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc';
  keyDerivation?: boolean;
  iterations?: number;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits for GCM
  private readonly saltLength = 32; // 256 bits for key derivation
  private readonly tagLength = 16; // 128 bits for auth tag
  private readonly defaultIterations = 100000; // PBKDF2 iterations

  private masterKey: Buffer;

  constructor(encryptionKey?: string) {
    const key = encryptionKey || config.encryption.key;
    
    if (!key) {
      throw new Error('Encryption key is required');
    }

    // If key is hex string, convert to buffer
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
      this.masterKey = Buffer.from(key, 'hex');
    } else {
      // Derive key from string using PBKDF2
      const salt = Buffer.from('aipromotapp-salt-2024', 'utf8');
      this.masterKey = pbkdf2Sync(key, salt, this.defaultIterations, this.keyLength, 'sha256');
    }

    if (this.masterKey.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength} bytes (${this.keyLength * 2} hex characters)`);
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string, options: EncryptionOptions = {}): EncryptedData {
    const {
      algorithm = this.algorithm,
      keyDerivation = false,
      iterations = this.defaultIterations,
    } = options;

    try {
      // Generate random IV
      const iv = randomBytes(this.ivLength);
      
      // Derive key if requested (adds extra security layer)
      let encryptionKey = this.masterKey;
      let salt: Buffer | undefined;
      
      if (keyDerivation) {
        salt = randomBytes(this.saltLength);
        encryptionKey = pbkdf2Sync(this.masterKey, salt, iterations, this.keyLength, 'sha256');
      }

      // Create cipher
      const cipher = createCipher(algorithm, encryptionKey);
      cipher.setAutoPadding(true);

      if (algorithm === 'aes-256-gcm') {
        (cipher as any).setAAD(Buffer.from('aipromotapp-aad', 'utf8'));
      }

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag for GCM
      let authTag = '';
      if (algorithm === 'aes-256-gcm') {
        authTag = (cipher as any).getAuthTag().toString('hex');
      }

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag,
        salt: salt?.toString('hex'),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: EncryptedData, options: EncryptionOptions = {}): string {
    const {
      algorithm = this.algorithm,
      keyDerivation = false,
      iterations = this.defaultIterations,
    } = options;

    try {
      // Derive key if salt is provided
      let decryptionKey = this.masterKey;
      
      if (keyDerivation && encryptedData.salt) {
        const salt = Buffer.from(encryptedData.salt, 'hex');
        decryptionKey = pbkdf2Sync(this.masterKey, salt, iterations, this.keyLength, 'sha256');
      }

      // Create decipher
      const decipher = createDecipher(algorithm, decryptionKey);
      
      if (algorithm === 'aes-256-gcm') {
        (decipher as any).setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        (decipher as any).setAAD(Buffer.from('aipromotapp-aad', 'utf8'));
      }

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt OAuth tokens with additional metadata
   */
  encryptOAuthToken(token: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    platform: string;
    userId: string;
  }): string {
    const tokenData = {
      ...token,
      encryptedAt: new Date().toISOString(),
      version: '1.0',
    };

    const encrypted = this.encrypt(JSON.stringify(tokenData), { keyDerivation: true });
    
    // Encode as base64 for storage
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  /**
   * Decrypt OAuth tokens
   */
  decryptOAuthToken(encryptedToken: string): {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    platform: string;
    userId: string;
    encryptedAt: string;
    version: string;
  } {
    try {
      const encryptedData = JSON.parse(Buffer.from(encryptedToken, 'base64').toString());
      const decrypted = this.decrypt(encryptedData, { keyDerivation: true });
      
      const tokenData = JSON.parse(decrypted);
      
      // Convert expiresAt back to Date if it exists
      if (tokenData.expiresAt) {
        tokenData.expiresAt = new Date(tokenData.expiresAt);
      }
      
      return tokenData;
    } catch (error) {
      throw new Error(`Failed to decrypt OAuth token: ${error.message}`);
    }
  }

  /**
   * Encrypt API keys with metadata
   */
  encryptAPIKey(apiKey: string, metadata: {
    service: string;
    userId: string;
    permissions?: string[];
  }): string {
    const keyData = {
      apiKey,
      ...metadata,
      encryptedAt: new Date().toISOString(),
    };

    const encrypted = this.encrypt(JSON.stringify(keyData), { keyDerivation: true });
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  /**
   * Decrypt API keys
   */
  decryptAPIKey(encryptedKey: string): {
    apiKey: string;
    service: string;
    userId: string;
    permissions?: string[];
    encryptedAt: string;
  } {
    try {
      const encryptedData = JSON.parse(Buffer.from(encryptedKey, 'base64').toString());
      const decrypted = this.decrypt(encryptedData, { keyDerivation: true });
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt API key: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  hashSensitiveData(data: string, salt?: string): {
    hash: string;
    salt: string;
  } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : randomBytes(this.saltLength);
    const hash = pbkdf2Sync(data, saltBuffer, this.defaultIterations, this.keyLength, 'sha256');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex'),
    };
  }

  /**
   * Verify hashed data
   */
  verifyHashedData(data: string, hash: string, salt: string): boolean {
    try {
      const computedHash = pbkdf2Sync(data, Buffer.from(salt, 'hex'), this.defaultIterations, this.keyLength, 'sha256');
      const providedHash = Buffer.from(hash, 'hex');
      
      return timingSafeEqual(computedHash, providedHash);
    } catch {
      return false;
    }
  }

  /**
   * Generate secure random keys
   */
  generateSecureKey(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Generate secure API key with prefix
   */
  generateAPIKey(prefix: string = 'aip'): string {
    const keyPart = this.generateSecureKey(16); // 32 hex characters
    const checksum = this.generateSecureKey(4); // 8 hex characters for checksum
    return `${prefix}_${keyPart}${checksum}`;
  }

  /**
   * Rotate encryption key (for key rotation strategy)
   */
  rotateKey(newKey: string): EncryptionService {
    return new EncryptionService(newKey);
  }

  /**
   * Encrypt data in chunks for large data
   */
  encryptLargeData(data: Buffer, chunkSize: number = 1024 * 64): EncryptedData[] {
    const chunks: EncryptedData[] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const encrypted = this.encrypt(chunk.toString('base64'), { keyDerivation: true });
      chunks.push(encrypted);
    }
    
    return chunks;
  }

  /**
   * Decrypt chunked data
   */
  decryptLargeData(chunks: EncryptedData[]): Buffer {
    const decryptedChunks: Buffer[] = [];
    
    for (const chunk of chunks) {
      const decrypted = this.decrypt(chunk, { keyDerivation: true });
      decryptedChunks.push(Buffer.from(decrypted, 'base64'));
    }
    
    return Buffer.concat(decryptedChunks);
  }

  /**
   * Secure data sanitization for logging
   */
  sanitizeForLogging(obj: any): any {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'api', 'auth',
      'credential', 'private', 'protected', 'confidential'
    ];

    const sanitize = (value: any): any => {
      if (typeof value === 'string') {
        // Check if the key or value looks sensitive
        const isSensitive = sensitiveKeys.some(sensitive => 
          value.toLowerCase().includes(sensitive) ||
          value.length > 20 && /[A-Za-z0-9+/=]{16,}/.test(value) // Base64-like patterns
        );
        
        return isSensitive ? '[REDACTED]' : value;
      }
      
      if (Array.isArray(value)) {
        return value.map(sanitize);
      }
      
      if (typeof value === 'object' && value !== null) {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          const isSensitiveKey = sensitiveKeys.some(sensitive => 
            key.toLowerCase().includes(sensitive)
          );
          
          sanitized[key] = isSensitiveKey ? '[REDACTED]' : sanitize(val);
        }
        return sanitized;
      }
      
      return value;
    };

    return sanitize(obj);
  }

  /**
   * Validate encryption key strength
   */
  static validateKeyStrength(key: string): {
    valid: boolean;
    score: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 0;

    // Check length
    if (key.length >= 64) {
      score += 30;
    } else if (key.length >= 32) {
      score += 20;
    } else {
      recommendations.push('Key should be at least 32 characters (64 for hex)');
    }

    // Check for hex format (preferred)
    if (/^[0-9a-fA-F]+$/.test(key) && key.length === 64) {
      score += 25;
    } else {
      recommendations.push('Consider using 64-character hexadecimal key');
    }

    // Check entropy
    const uniqueChars = new Set(key).size;
    if (uniqueChars > key.length * 0.7) {
      score += 25;
    } else if (uniqueChars > key.length * 0.5) {
      score += 15;
    } else {
      recommendations.push('Key has low entropy - use more diverse characters');
    }

    // Check for patterns
    if (!/(.)\1{2,}/.test(key)) {
      score += 10;
    } else {
      recommendations.push('Avoid repeated character patterns');
    }

    // Check for common weak patterns
    const weakPatterns = ['12345', 'abcde', '00000', 'aaaaa'];
    if (!weakPatterns.some(pattern => key.includes(pattern))) {
      score += 10;
    } else {
      recommendations.push('Avoid common patterns like 12345 or aaaaa');
    }

    return {
      valid: score >= 70,
      score,
      recommendations,
    };
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Helper functions for database field encryption
export const encryptDatabaseField = (value: string): string => {
  const encrypted = encryptionService.encrypt(value, { keyDerivation: true });
  return Buffer.from(JSON.stringify(encrypted)).toString('base64');
};

export const decryptDatabaseField = (encryptedValue: string): string => {
  try {
    const encryptedData = JSON.parse(Buffer.from(encryptedValue, 'base64').toString());
    return encryptionService.decrypt(encryptedData, { keyDerivation: true });
  } catch (error) {
    throw new Error(`Failed to decrypt database field: ${error.message}`);
  }
};

// Middleware for automatic field encryption/decryption
export const createFieldEncryptionMiddleware = (fields: string[]) => {
  return {
    // Encrypt before saving to database
    beforeSave: (data: any) => {
      const encrypted = { ...data };
      for (const field of fields) {
        if (encrypted[field] && typeof encrypted[field] === 'string') {
          encrypted[field] = encryptDatabaseField(encrypted[field]);
        }
      }
      return encrypted;
    },

    // Decrypt after loading from database
    afterLoad: (data: any) => {
      const decrypted = { ...data };
      for (const field of fields) {
        if (decrypted[field] && typeof decrypted[field] === 'string') {
          try {
            decrypted[field] = decryptDatabaseField(decrypted[field]);
          } catch {
            // Field might not be encrypted yet, leave as is
          }
        }
      }
      return decrypted;
    },
  };
};
