import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      emailVerified: Date | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role: UserRole
    emailVerified: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
    emailVerified: Date | null
  }
}

// User roles for RBAC
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR"
}

// Auth-related interfaces
export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse<T = any> {
  success: boolean
  data?: T
  error?: AuthError
}

// Database user model (for backend communication)
export interface DbUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  emailVerified: Date | null
  password?: string
  resetToken?: string | null
  resetTokenExpiry?: Date | null
  createdAt: Date
  updatedAt: Date
}
