// Core API client
export { apiClient } from './client'
export type { ApiResponse, ApiRequestOptions } from './client'

// Authentication
export { authService } from './auth'
export type { 
  LoginCredentials, 
  RegisterData, 
  User, 
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData
} from './auth'

// Startups and Intake
export { startupsService } from './startups'
export type { 
  Startup, 
  CreateStartupData, 
  UpdateStartupData 
} from './startups'

// Content Management
export { contentService } from './content'
export type { 
  ContentPiece, 
  ContentGenerationRequest, 
  BulkContentRequest,
  ContentTemplate
} from './content'

// File Upload
export { uploadService, fileHelpers } from './upload'
export type { 
  UploadedFile, 
  UploadProgress, 
  UploadProgressCallback 
} from './upload'

// Admin Services
export { adminService } from './admin'
export type { 
  AdminStats, 
  SystemHealth, 
  ActivityLog, 
  SystemSettings 
} from './admin'

// Import all services to create unified API
import { authService } from './auth'
import { startupsService } from './startups'
import { contentService } from './content'
import { uploadService } from './upload'
import { adminService } from './admin'
import { apiClient } from './client'

// Unified API service (convenience wrapper)
export const api = {
  auth: authService,
  startups: startupsService,
  content: contentService,
  upload: uploadService,
  admin: adminService,
  
  // Direct client access for custom requests
  client: apiClient
}
