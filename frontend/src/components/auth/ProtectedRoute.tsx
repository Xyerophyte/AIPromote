"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserRole } from "@/types/auth"
import LoadingSpinner from "@/components/ui/loading-spinner"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  fallback?: ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  fallback = <LoadingSpinner />,
  redirectTo = "/auth/signin"
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = !!session?.user
  const userRole = session?.user?.role

  // Helper functions for role checking
  const hasRole = (role: UserRole) => userRole === role
  const hasAnyRole = (roles: UserRole[]) => userRole ? roles.includes(userRole) : false

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  // Show loading while checking authentication
  if (isLoading) {
    return fallback
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return fallback
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    router.push("/unauthorized")
    return fallback
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    router.push("/unauthorized")
    return fallback
  }

  return <>{children}</>
}

// HOC version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRole?: UserRole
    requiredRoles?: UserRole[]
    redirectTo?: string
  } = {}
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute
        requiredRole={options.requiredRole}
        requiredRoles={options.requiredRoles}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`
  
  return ProtectedComponent
}
