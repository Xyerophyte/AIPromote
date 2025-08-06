import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { UserRole } from "@/types/auth"

// Define route permissions
const routePermissions: Record<string, UserRole[]> = {
  "/dashboard": [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
  "/admin": [UserRole.ADMIN],
  "/moderator": [UserRole.MODERATOR, UserRole.ADMIN],
  "/profile": [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
}

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/error",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth",
]

// Routes that require authentication but no specific role
const protectedRoutes = [
  "/dashboard",
  "/profile",
]

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

function hasRequiredRole(userRole: UserRole, pathname: string): boolean {
  const requiredRoles = routePermissions[pathname]
  if (!requiredRoles) {
    // If no specific role required, allow any authenticated user
    return true
  }
  return requiredRoles.includes(userRole)
}

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Allow public routes
  if (isPublicRoute(nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Redirect to signin if not authenticated
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl)
    )
  }

  // Check role-based access
  const userRole = req.auth?.user?.role
  if (userRole && !hasRequiredRole(userRole, nextUrl.pathname)) {
    return NextResponse.redirect(
      new URL("/unauthorized", nextUrl)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
