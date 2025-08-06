import crypto from 'crypto';
import { config } from '../config/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000; // PBKDF2 iterations

interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
  salt?: string;
}

interface KeyDerivationResult {
  key: Buffer;
  salt: Buffer;
}

// Enhanced encryption class for sensitive data
export class AdvancedEncryption {
  // Derive key using PBKDF2
  private static deriveKey(password: string, salt?: Buffer): KeyDerivationResult {
    const derivedSalt = salt || crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(password, derivedSalt, ITERATIONS, KEY_LENGTH, 'sha256');
    return { key, salt: derivedSalt };
  }

  // Encrypt with password-derived key
  static encryptWithPassword(plaintext: string, password: string): string {
    const { key, salt } = this.deriveKey(password);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    const result: EncryptionResult = {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
    };
    
    return JSON.stringify(result);
  }

  // Decrypt with password-derived key
  static decryptWithPassword(encryptedData: string, password: string): string {
    const data: EncryptionResult = JSON.parse(encryptedData);
    
    if (!data.salt) {
      throw new Error('Salt is required for password-based decryption');
    }
    
    const salt = Buffer.from(data.salt, 'hex');
    const { key } = this.deriveKey(password, salt);
    const iv = Buffer.from(data.iv, 'hex');
    
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Encrypt large files with streaming
  static encryptStream(inputStream: NodeJS.ReadableStream, outputStream: NodeJS.WritableStream, key: Buffer): Promise<{ iv: string; tag: string }> {
    return new Promise((resolve, reject) => {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
      
      // Write IV to the beginning of the output stream
      outputStream.write(iv);
      
      inputStream.pipe(cipher).pipe(outputStream, { end: false });
      
      cipher.on('end', () => {
        const tag = cipher.getAuthTag();
        outputStream.write(tag);
        outputStream.end();
        
        resolve({
          iv: iv.toString('hex'),
          tag: tag.toString('hex'),
        });
      });
      
      cipher.on('error', reject);
      inputStream.on('error', reject);
      outputStream.on('error', reject);
    });
  }

  // Generate secure encryption key
  static generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  // Key rotation helper
  static rotateEncryptedData(encryptedData: string, oldKey: string, newKey: string): string {
    // Decrypt with old key
    const decrypted = decrypt(encryptedData);
    
    // Re-encrypt with new key
    const originalKey = config.encryption.key;
    (config.encryption as any).key = newKey;
    const reencrypted = encrypt(decrypted);
    (config.encryption as any).key = originalKey;
    
    return reencrypted;
  }
}

/**
 * Encrypt sensitive data like OAuth tokens
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipherGCM(ALGORITHM, config.encryption.key, iv);
  cipher.setAAD(Buffer.from('social-media-token', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  const result: EncryptionResult = {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
  
  return JSON.stringify(result);
}

/**
 * Decrypt sensitive data like OAuth tokens
 */
export function decrypt(encryptedData: string): string {
  const data: EncryptionResult = JSON.parse(encryptedData);
  const iv = Buffer.from(data.iv, 'hex');
  
  const decipher = crypto.createDecipherGCM(ALGORITHM, config.encryption.key, iv);
  decipher.setAAD(Buffer.from('social-media-token', 'utf8'));
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash data for comparison (one-way)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify webhook signatures
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
