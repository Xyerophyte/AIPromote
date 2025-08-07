"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@/types/auth"

export function useAuth() {
  let session, status
  
  try {
    const sessionData = useSession()
    session = sessionData.data
    status = sessionData.status
  } catch (error) {
    console.warn('NextAuth SessionProvider not configured properly, using mock data for development')
    // Fallback for development when SessionProvider is not properly configured
    session = null
    status = 'unauthenticated'
  }
  
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated" || process.env.NODE_ENV === 'development'
  
  // For development, provide mock user data
  const user = session?.user || (process.env.NODE_ENV === 'development' ? {
    id: 'dev-user-1',
    email: 'demo@example.com',
    name: 'Development User',
    role: 'USER' as UserRole,
    emailVerified: new Date(),
  } : null)

  const requireAuth = (redirectTo = "/auth/signin") => {
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo)
      }
    }, [isAuthenticated, isLoading, redirectTo])
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false
  }

  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN)
  }

  const isModerator = (): boolean => {
    return hasRole(UserRole.MODERATOR)
  }

  const canAccess = (requiredRoles: UserRole[]): boolean => {
    if (!isAuthenticated || !user?.role) return false
    return requiredRoles.includes(user.role)
  }

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    requireAuth,
    hasRole,
    hasAnyRole,
    isAdmin,
    isModerator,
    canAccess,
  }
}

// Hook for pages that require authentication
export function useRequireAuth(redirectTo = "/auth/signin") {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  return { isAuthenticated, isLoading }
}

// Hook for role-based access control
export function useRequireRole(allowedRoles: UserRole[], redirectTo = "/unauthorized") {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/signin")
      } else if (user?.role && !allowedRoles.includes(user.role)) {
        router.push(redirectTo)
      }
    }
  }, [isAuthenticated, isLoading, user?.role, allowedRoles, redirectTo, router])

  const hasAccess = user?.role ? allowedRoles.includes(user.role) : false

  return { hasAccess, isLoading }
}
