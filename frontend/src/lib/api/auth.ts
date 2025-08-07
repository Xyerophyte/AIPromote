import { apiClient, ApiResponse } from './client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  image?: string | null
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthResponse {
  user: User
  token?: string
}

export interface ForgotPasswordData {
  email: string
  resetToken: string
  resetTokenExpiry: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    return apiClient.post('/api/auth/register', data, false)
  }

  /**
   * Sign in user with credentials
   */
  async signin(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    return apiClient.post('/api/auth/signin', credentials, false)
  }

  /**
   * Handle OAuth user creation/update
   */
  async oauthUser(data: {
    provider: string
    providerId: string
    email: string
    name?: string
    image?: string
  }): Promise<ApiResponse<User>> {
    return apiClient.post('/api/auth/oauth', data, false)
  }

  /**
   * Send password reset email
   */
  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/auth/forgot-password', data, false)
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/auth/reset-password', data, false)
  }

  /**
   * Get user by ID (for session validation)
   */
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get(`/api/users/${userId}`, true)
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<ApiResponse<{ valid: boolean }>> {
    return apiClient.get('/api/auth/session', true)
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/api/auth/refresh', {}, true)
  }

  /**
   * Logout user (server-side cleanup)
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/auth/logout', {}, true)
  }
}

export const authService = new AuthService()
