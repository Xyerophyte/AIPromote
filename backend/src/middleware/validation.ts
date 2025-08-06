import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { ValidationError } from '../utils/errors';

// Custom validation schemas
export const ValidationSchemas = {
  // Email validation
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  
  // Password validation
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  // URL validation
  url: z.string().url('Invalid URL format').optional(),
  
  // Content text validation
  contentText: z.string().min(1).max(5000, 'Content must be less than 5000 characters'),
  
  // HTML content validation
  htmlContent: z.string().min(1).max(10000, 'HTML content must be less than 10000 characters'),
  
  // Social media handle validation
  socialHandle: z
    .string()
    .regex(/^[a-zA-Z0-9_]{1,30}$/, 'Invalid social media handle format')
    .optional(),
  
  // Organization name validation
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.&]+$/, 'Organization name contains invalid characters'),
  
  // User name validation
  userName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters'),
  
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Platform validation
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS', 'REDDIT', 'FACEBOOK', 'THREADS']),
  
  // Content type validation
  contentType: z.enum(['POST', 'THREAD', 'STORY', 'REEL', 'SHORT', 'CAROUSEL', 'POLL']),
  
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  
  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, 'Start date must be before end date'),
  
  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().regex(/^(image|video|audio|application)\/[a-zA-Z0-9\-\+]+$/),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  }),
};

// Content sanitization functions
export class ContentSanitizer {
  // Sanitize HTML content
  static sanitizeHtml(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3',
        'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }

  // Sanitize plain text
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Sanitize social media content
  static sanitizeSocialContent(content: string): string {
    // Allow hashtags, mentions, and basic formatting
    return content
      .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Sanitize URL
  static sanitizeUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return null;
      }
      return parsedUrl.toString();
    } catch {
      return null;
    }
  }

  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_.]/g, '_') // Replace invalid characters
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      .substring(0, 255); // Limit length
  }
}

// SQL injection prevention
export class SQLInjectionPrevention {
  private static suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\\-{2})|(;)|(\/\*)|(\*\/))/g,
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
  ];

  static detectSQLInjection(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  static sanitizeForSQL(input: string): string {
    // This is a basic sanitization - Prisma handles most SQL injection prevention
    return input
      .replace(/['";\\]/g, '') // Remove dangerous characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, ''); // Remove block comment end
  }

  static validateInput(input: any): void {
    if (typeof input === 'string' && this.detectSQLInjection(input)) {
      throw new ValidationError('Input contains potentially dangerous content', 'sql_injection');
    }
    
    if (typeof input === 'object' && input !== null) {
      Object.values(input).forEach(value => {
        if (typeof value === 'string') {
          this.validateInput(value);
        } else if (typeof value === 'object') {
          this.validateInput(value);
        }
      });
    }
  }
}

// Cross-Site Scripting (XSS) prevention
export class XSSPrevention {
  private static xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /expression\s*\(/gi,
  ];

  static detectXSS(input: string): boolean {
    return this.xssPatterns.some(pattern => pattern.test(input));
  }

  static sanitizeForXSS(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static validateInput(input: any): void {
    if (typeof input === 'string' && this.detectXSS(input)) {
      throw new ValidationError('Input contains potentially dangerous XSS content', 'xss_detected');
    }
    
    if (typeof input === 'object' && input !== null) {
      Object.values(input).forEach(value => {
        if (typeof value === 'string') {
          this.validateInput(value);
        } else if (typeof value === 'object') {
          this.validateInput(value);
        }
      });
    }
  }
}

// Validation middleware factory
export function createValidationMiddleware(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate and sanitize request body
      if (schemas.body && request.body) {
        // Check for SQL injection and XSS
        SQLInjectionPrevention.validateInput(request.body);
        XSSPrevention.validateInput(request.body);
        
        // Validate with Zod schema
        const validatedBody = await schemas.body.parseAsync(request.body);
        request.body = validatedBody;
      }

      // Validate query parameters
      if (schemas.query && request.query) {
        SQLInjectionPrevention.validateInput(request.query);
        XSSPrevention.validateInput(request.query);
        
        const validatedQuery = await schemas.query.parseAsync(request.query);
        request.query = validatedQuery;
      }

      // Validate route parameters
      if (schemas.params && request.params) {
        SQLInjectionPrevention.validateInput(request.params);
        XSSPrevention.validateInput(request.params);
        
        const validatedParams = await schemas.params.parseAsync(request.params);
        request.params = validatedParams;
      }

    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          error: 'Validation Error',
          message: 'Request validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      if (error instanceof ValidationError) {
        reply.code(400).send({
          error: 'Validation Error',
          message: error.message,
          field: error.field,
        });
        return;
      }

      throw error;
    }
  };
}

// Common validation schemas for different endpoints
export const CommonValidations = {
  // Authentication
  login: {
    body: z.object({
      email: ValidationSchemas.email,
      password: z.string().min(1, 'Password is required'),
    }),
  },

  register: {
    body: z.object({
      email: ValidationSchemas.email,
      password: ValidationSchemas.password,
      name: ValidationSchemas.userName.optional(),
    }),
  },

  // Organization management
  createOrganization: {
    body: z.object({
      name: ValidationSchemas.organizationName,
      description: z.string().max(500).optional(),
      url: ValidationSchemas.url,
      category: z.string().max(50).optional(),
    }),
  },

  updateOrganization: {
    params: z.object({
      id: ValidationSchemas.uuid,
    }),
    body: z.object({
      name: ValidationSchemas.organizationName.optional(),
      description: z.string().max(500).optional(),
      url: ValidationSchemas.url,
      category: z.string().max(50).optional(),
    }),
  },

  // Content management
  createContent: {
    body: z.object({
      platform: ValidationSchemas.platform,
      type: ValidationSchemas.contentType,
      title: z.string().max(200).optional(),
      body: ValidationSchemas.contentText,
      hashtags: z.array(z.string().regex(/^#?[a-zA-Z0-9_]+$/)).max(10).optional(),
      mentions: z.array(z.string().regex(/^@?[a-zA-Z0-9_]+$/)).max(5).optional(),
      scheduledAt: z.string().datetime().optional(),
    }),
  },

  // Social media account
  connectSocialAccount: {
    body: z.object({
      platform: ValidationSchemas.platform,
      handle: ValidationSchemas.socialHandle,
      accessToken: z.string().min(1),
      refreshToken: z.string().optional(),
    }),
  },

  // Pagination and filtering
  listWithPagination: {
    query: ValidationSchemas.pagination.merge(
      z.object({
        search: z.string().max(100).optional(),
        sortBy: z.string().max(50).optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    ),
  },

  // File upload
  fileUpload: {
    body: ValidationSchemas.fileUpload,
  },
};

// Input sanitization middleware
export const sanitizationMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // Sanitize request body
  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeObject(request.body);
  }

  // Sanitize query parameters
  if (request.query && typeof request.query === 'object') {
    request.query = sanitizeObject(request.query);
  }
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return ContentSanitizer.sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[ContentSanitizer.sanitizeText(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Content validation for social media posts
export function validateSocialContent(platform: string, content: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Platform-specific validation
  switch (platform.toUpperCase()) {
    case 'TWITTER':
      if (content.length > 280) {
        errors.push('Twitter posts cannot exceed 280 characters');
      }
      break;
    case 'LINKEDIN':
      if (content.length > 3000) {
        errors.push('LinkedIn posts cannot exceed 3000 characters');
      }
      break;
    case 'INSTAGRAM':
      if (content.length > 2200) {
        errors.push('Instagram captions cannot exceed 2200 characters');
      }
      break;
  }

  // Common validation
  if (ContentSanitizer.sanitizeSocialContent(content) !== content) {
    warnings.push('Content contains potentially unsafe elements that have been sanitized');
  }

  // Check for excessive hashtags
  const hashtagCount = (content.match(/#[\w]+/g) || []).length;
  if (hashtagCount > 10) {
    warnings.push('Posts with too many hashtags may have reduced engagement');
  }

  // Check for excessive mentions
  const mentionCount = (content.match(/@[\w]+/g) || []).length;
  if (mentionCount > 5) {
    warnings.push('Posts with too many mentions may appear spammy');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
