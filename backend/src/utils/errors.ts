export class StrategyGenerationError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, details?: any, code: string = 'STRATEGY_GENERATION_ERROR') {
    super(message);
    this.name = 'StrategyGenerationError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StrategyGenerationError);
    }
  }
}

export class AIProviderError extends Error {
  public readonly provider: string;
  public readonly originalError?: any;
  public readonly retryable: boolean;

  constructor(provider: string, message: string, originalError?: any, retryable: boolean = true) {
    super(`AI Provider Error (${provider}): ${message}`);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.originalError = originalError;
    this.retryable = retryable;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIProviderError);
    }
  }
}

export class ValidationError extends Error {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class RateLimitError extends Error {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }
}

export class ContentSafetyError extends Error {
  public readonly violations: Array<{
    type: string;
    severity: string;
    message: string;
  }>;

  constructor(message: string, violations: Array<{ type: string; severity: string; message: string }>) {
    super(message);
    this.name = 'ContentSafetyError';
    this.violations = violations;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContentSafetyError);
    }
  }
}
