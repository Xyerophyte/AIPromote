"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { UserRole } from "@/types/auth"

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated" && !!session?.user
  const user = session?.user

  const login = async (provider?: string, options?: any) => {
    if (provider) {
      await signIn(provider, options)
    } else {
      router.push("/auth/signin")
    }
  }

  const logout = async () => {
    await signOut({ 
      callbackUrl: "/", 
      redirect: true 
    })
  }

  const hasRole = (role: UserRole): boolean => {
    if (!user?.role) return false
    
    // Admin has all permissions
    if (user.role === UserRole.ADMIN) return true
    
    // Moderator can access moderator and user content
    if (user.role === UserRole.MODERATOR && (role === UserRole.MODERATOR || role === UserRole.USER)) {
      return true
    }
    
    // Exact role match
    return user.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  const requireAuth = (redirectTo: string = "/auth/signin") => {
    if (!isAuthenticated && !isLoading) {
      router.push(redirectTo)
      return false
    }
    return true
  }

  const requireRole = (role: UserRole, redirectTo: string = "/unauthorized") => {
    if (!isAuthenticated && !isLoading) {
      router.push("/auth/signin")
      return false
    }
    
    if (isAuthenticated && !hasRole(role)) {
      router.push(redirectTo)
      return false
    }
    
    return true
  }

  const updateSession = async (data: any) => {
    await update(data)
  }

  return {
    // Session data
    session,
    user,
    isLoading,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    updateSession,
    
    // Authorization helpers
    hasRole,
    hasAnyRole,
    requireAuth,
    requireRole,
  }
}
