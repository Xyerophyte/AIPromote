import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Route plugin options
export interface RouteOptions {
  prefix?: string;
  logLevel?: string;
}

// Startup route types
export interface StartupBasics {
  name: string;
  url?: string;
  tagline: string;
  description: string;
  category: string;
  stage: 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth';
  pricing?: string;
  markets: string[];
  languages: string[];
}

export interface ICPPersona {
  name: string;
  title: string;
  company_size: string;
  industry: string;
  pain_points: string[];
  jobs_to_be_done: string[];
}

export interface ICP {
  personas: ICPPersona[];
  priority_segments: string[];
}

export interface ProofPoint {
  type: 'metric' | 'customer' | 'award' | 'press' | 'other';
  description: string;
  value?: string;
}

export interface Competitor {
  name: string;
  positioning: string;
}

export interface Positioning {
  usp: string;
  differentiators: string[];
  proof_points: ProofPoint[];
  competitors: Competitor[];
}

export interface Brand {
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'technical';
  voice_description: string;
  allowed_phrases?: string[];
  forbidden_phrases?: string[];
  example_content: string;
  compliance_notes?: string;
}

export interface KPI {
  metric: string;
  target: string;
  timeframe: string;
}

export interface Goals {
  primary_goal: 'awareness' | 'leads' | 'signups' | 'demos' | 'sales';
  target_platforms: Array<'x' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'reddit'>;
  posting_frequency: 'daily' | '3x-week' | 'weekly' | 'biweekly';
  kpis: KPI[];
}

export interface AssetFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Assets {
  logo?: AssetFile[];
  screenshots?: AssetFile[];
  demo_videos?: AssetFile[];
  case_studies?: AssetFile[];
  pitch_deck?: AssetFile[];
  blog_links?: string[];
}

export interface CompleteIntake {
  startupBasics: StartupBasics;
  icp: ICP;
  positioning: Positioning;
  brand: Brand;
  goals: Goals;
  assets: Assets;
}

// Request types for routes
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role?: string;
    name?: string;
  };
}

export interface StartupCreateRequest extends AuthenticatedRequest {
  body: CompleteIntake;
}

export interface StartupUpdateRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: CompleteIntake;
}

export interface StartupDraftRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: any; // Draft can be partial
}

export interface StartupGetRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

export interface FileUploadRequest extends AuthenticatedRequest {
  file: () => Promise<{
    toBuffer: () => Promise<Buffer>;
    filename: string;
    mimetype: string;
    fields: Record<string, { value: any }>;
  }>;
  query?: {
    type?: string;
  };
}

export interface FileDeleteRequest extends AuthenticatedRequest {
  query: {
    key: string;
  };
}

// Response types
export interface StartupResponse {
  startup: {
    id: string;
    name: string;
    url?: string;
    tagline: string;
    description: string;
    category: string;
    stage: string;
    pricing?: string;
    markets: string[];
    languages: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  message?: string;
}

export interface StartupsListResponse {
  startups: Array<{
    id: string;
    name: string;
    url?: string;
    tagline: string;
    description: string;
    category: string;
    stage: string;
    brandRules?: any;
    assets?: any[];
    strategyDocs?: any[];
  }>;
}

export interface FileUploadResponse {
  success: boolean;
  url: string;
  key: string;
  extractedText?: string | null;
  metadata: {
    name: string;
    size: number;
    type: string;
  };
}

export interface DraftSaveResponse {
  success: boolean;
}

// Route handler types with proper typing
export type StartupRouteHandler<TRequest = AuthenticatedRequest, TResponse = any> = (
  request: TRequest,
  reply: FastifyReply
) => Promise<TResponse>;

// Plugin types
export type StartupRoutesPlugin = FastifyPluginAsync<RouteOptions>;
export type UploadRoutesPlugin = FastifyPluginAsync<RouteOptions>;
export type AuthRoutesPlugin = FastifyPluginAsync<RouteOptions>;

// Middleware types
export interface AuthMiddleware {
  (request: FastifyRequest, reply: FastifyReply): Promise<void>;
}

export interface RateLimitMiddleware {
  createMiddleware(): (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void;
}

// Schema validation types
export interface ValidationSchema {
  body?: any;
  querystring?: any;
  params?: any;
  headers?: any;
  response?: Record<number, any>;
}

// Error types specific to routes
export interface RouteError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

// Helper function types
export type ExtractS3Key = (url: string) => string;
export type GetNextVersion = (startupId: string, tx: any) => Promise<number>;
