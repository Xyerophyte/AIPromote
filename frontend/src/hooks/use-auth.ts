"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@/types/auth"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"
  const user = session?.user

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
