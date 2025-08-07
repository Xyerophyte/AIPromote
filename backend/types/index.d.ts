// Re-export all type definitions from fastify module
export * from './fastify';

// Import necessary types for global use
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

// Application-specific types
export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  jwt: {
    secret: string;
    expiresIn: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  database: {
    url: string;
    maxConnections?: number;
  };
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
  };
  stripe?: {
    secretKey: string;
    webhookSecret: string;
  };
  openai?: {
    apiKey: string;
  };
  anthropic?: {
    apiKey: string;
  };
}

// Service response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Async handler type for better error handling
export type AsyncHandler<T = any> = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<T>;

// Database query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  include?: string[];
  where?: Record<string, any>;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
  metadata?: Record<string, string>;
}

// AI Strategy types
export interface AIStrategyRequest {
  startupId: string;
  prompt?: string;
  parameters?: {
    tone?: string;
    style?: string;
    length?: 'short' | 'medium' | 'long';
    platform?: string;
  };
}

export interface AIStrategyResponse {
  id: string;
  content: string;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

// Content generation types
export interface ContentGenerationRequest {
  type: 'post' | 'article' | 'email' | 'ad';
  topic: string;
  tone?: string;
  keywords?: string[];
  targetAudience?: string;
  maxLength?: number;
  platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'blog';
}

export interface GeneratedContent {
  id: string;
  content: string;
  headline?: string;
  hashtags?: string[];
  metadata?: {
    readingTime?: number;
    wordCount?: number;
    sentiment?: string;
  };
}

// Social media types
export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  content: string;
  mediaUrls?: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
    impressions?: number;
  };
}

// Analytics types
export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    posts?: number;
    engagement?: number;
    reach?: number;
    clicks?: number;
    conversions?: number;
  };
  platforms?: Record<string, any>;
}

// Billing types
export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    aiGenerations?: number;
    posts?: number;
    users?: number;
    storage?: number;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  signature?: string;
}

// Cache types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
}

// Job queue types
export interface JobData {
  id: string;
  type: string;
  payload: any;
  attempts?: number;
  maxAttempts?: number;
  scheduledAt?: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Audit log types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Export type utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = any> = () => Promise<T>;
export type Callback<T = any> = (error: Error | null, result?: T) => void;

// Type guards
export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray<T = any>(value: any): value is T[] {
  return Array.isArray(value);
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
