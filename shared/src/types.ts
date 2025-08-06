// User types
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  plan: string; // "free", "pro"
  role: UserRole;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Platform types
export enum Platform {
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  YOUTUBE_SHORTS = 'YOUTUBE_SHORTS',
  REDDIT = 'REDDIT',
  FACEBOOK = 'FACEBOOK',
  THREADS = 'THREADS'
}

// Content types
export enum ContentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED'
}

export enum ContentType {
  POST = 'POST',
  THREAD = 'THREAD',
  STORY = 'STORY',
  REEL = 'REEL',
  SHORT = 'SHORT',
  CAROUSEL = 'CAROUSEL',
  POLL = 'POLL'
}

export enum PostStatus {
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING'
}

// Strategy types
export enum StrategyStatus {
  PROPOSED = 'PROPOSED',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED'
}

// Organization (formerly Startup) types
export interface Organization {
  id: string;
  userId: string;
  name: string;
  url?: string;
  stage?: string; // e.g., "pre-seed", "growth", "series-a"
  pricing?: string;
  description?: string;
  tagline?: string;
  category?: string;
  markets: string[]; // e.g., ["US", "EU"]
  languages: string[]; // e.g., ["en", "es"]
  createdAt: Date;
  updatedAt: Date;
}

// Founder types
export interface Founder {
  id: string;
  organizationId: string;
  name: string;
  role?: string; // e.g., "CEO", "CTO", "Co-founder"
  email?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  bio?: string;
  imageUrl?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AI Strategy types
export interface AIStrategy {
  id: string;
  organizationId: string;
  version: number;
  status: StrategyStatus;
  positioning: any; // JSON - Positioning brief & messaging hierarchy
  audienceSegments: any; // JSON - Array of audience segments + key messages
  contentPillars: any; // JSON - 3-5 content pillars
  channelPlan: any; // JSON - Channel strategy per platform
  cadence: any; // JSON - Cadence plan with optimal posting windows
  calendarSkeleton: any; // JSON - 90-day content calendar skeleton
  generatedBy?: string; // AI model used
  confidence?: number; // Confidence score 0-1
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Content Piece types
export interface ContentPiece {
  id: string;
  organizationId: string;
  pillarId?: string;
  platform: Platform;
  status: ContentStatus;
  type: ContentType;
  title?: string;
  body: string;
  hashtags: string[];
  mentions: string[];
  cta?: string; // Call to action
  hook?: string; // Opening hook
  mediaRefs?: any; // JSON - { image: s3Key, prompt: string }
  scheduledAt?: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  seriesId?: string;
  sequenceNo?: number;
  rationale?: string; // Why this hook/format was chosen
  confidence?: number; // AI confidence score
  generatedBy?: string; // AI model used
  createdAt: Date;
  updatedAt: Date;
}

// Social Account types
export interface SocialAccount {
  id: string;
  organizationId: string;
  platform: Platform;
  handle: string; // @username or profile handle
  displayName?: string; // Full name or business name
  profileUrl?: string; // Full profile URL
  accountId?: string; // Platform-specific account ID
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isActive: boolean;
  lastSyncAt?: Date;
  errorMessage?: string; // Last error if any
  createdAt: Date;
  updatedAt: Date;
}

// Scheduled Post types
export interface ScheduledPost {
  id: string;
  organizationId: string;
  contentPieceId: string;
  socialAccountId: string;
  scheduledAt: Date;
  publishedAt?: Date;
  status: PostStatus;
  platformPostId?: string; // ID from the social platform after publishing
  platformUrl?: string; // URL to the published post
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export enum MetricType {
  ENGAGEMENT = 'ENGAGEMENT',
  REACH = 'REACH',
  CONVERSION = 'CONVERSION',
  GROWTH = 'GROWTH'
}

export interface Analytics {
  id: string;
  organizationId: string;
  contentPieceId?: string;
  scheduledPostId?: string;
  socialAccountId?: string;
  platform: Platform;
  metricType: MetricType;
  // Engagement metrics
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  // Reach metrics
  reach: number;
  followersDelta: number;
  // Conversion metrics
  websiteClicks: number;
  signups: number;
  demos: number;
  // Time-based data
  periodStart: Date;
  periodEnd: Date;
  collectedAt: Date;
  // Calculated metrics
  engagementRate?: number;
  ctr?: number; // Click-through rate
  createdAt: Date;
  updatedAt: Date;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// HTTP Status codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}
