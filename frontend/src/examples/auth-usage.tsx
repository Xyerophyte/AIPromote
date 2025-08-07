/**
 * NextAuth.js v5 with Supabase Integration - Usage Examples
 * 
 * This file contains examples of how to use the authentication system
 * in different scenarios throughout the application.
 */

"use client"

import { useAuth } from "@/hooks/useAuth"
import { useUser } from "@/contexts/UserContext"
import { UserRole } from "@/types/auth"
import { signIn, signOut } from "next-auth/react"
import ProtectedRoute, { withProtectedRoute } from "@/components/auth/ProtectedRoute"

// Example 1: Using the useAuth hook for authentication state
function AuthExample() {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout, 
    hasRole, 
    hasAnyRole 
  } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Authentication Status</h2>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name || user?.email}!</p>
          <p>Role: {user?.role}</p>
          <button onClick={logout}>Sign Out</button>
          
          {/* Role-based content */}
          {hasRole(UserRole.ADMIN) && (
            <div>Admin-only content</div>
          )}
          
          {hasAnyRole([UserRole.ADMIN, UserRole.MODERATOR]) && (
            <div>Admin or Moderator content</div>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => login('google')}>Sign in with Google</button>
          <button onClick={() => login('github')}>Sign in with GitHub</button>
          <button onClick={() => login()}>Sign in with Email</button>
        </div>
      )}
    </div>
  )
}

// Example 2: Using the UserContext for more complex state management
function UserContextExample() {
  const { user, isAuthenticated, hasRole, refreshUser } = useUser()

  return (
    <div>
      {isAuthenticated && (
        <div>
          <h3>User Profile</h3>
          <p>ID: {user?.id}</p>
          <p>Email: {user?.email}</p>
          <p>Email Verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
          <button onClick={refreshUser}>Refresh Profile</button>
        </div>
      )}
    </div>
  )
}

// Example 3: Protected Route Component
function ProtectedPageExample() {
  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}

// Example 4: Admin-only Protected Route
function AdminOnlyExample() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div>This content is only visible to admins</div>
    </ProtectedRoute>
  )
}

// Example 5: Multiple roles allowed
function ModeratorOrAdminExample() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.MODERATOR, UserRole.ADMIN]}>
      <div>This content is visible to moderators and admins</div>
    </ProtectedRoute>
  )
}

// Example 6: Using Higher-Order Component for route protection
const ProtectedComponent = withProtectedRoute(
  function MyComponent() {
    return <div>This component is automatically protected</div>
  },
  { requiredRole: UserRole.USER }
)

const AdminComponent = withProtectedRoute(
  function AdminPanel() {
    return <div>Admin Panel</div>
  },
  { requiredRole: UserRole.ADMIN }
)

// Example 7: Server-side authentication check
import { auth } from "@/lib/auth"

async function ServerComponentExample() {
  const session = await auth()
  
  if (!session?.user) {
    return <div>Please sign in to view this content</div>
  }

  return (
    <div>
      <h2>Server-side authenticated content</h2>
      <p>Hello, {session.user.name}!</p>
      <p>Your role: {session.user.role}</p>
    </div>
  )
}

// Example 8: API Route Protection (for reference)
/*
// In an API route file (e.g., app/api/protected/route.ts)
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { UserRole } from "@/types/auth"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Check for specific role
  if (session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  return NextResponse.json({ 
    message: "Protected data",
    user: session.user 
  })
}
*/

// Example 9: Sign in programmatically
function ProgrammaticSignInExample() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { 
      callbackUrl: "/dashboard",
      redirect: true 
    })
  }

  const handleCredentialsSignIn = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false
    })
    
    if (result?.error) {
      console.error("Sign in error:", result.error)
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <div>
      <button onClick={handleGoogleSignIn}>
        Sign in with Google
      </button>
      {/* Form for credentials would be here */}
    </div>
  )
}

// Example 10: Role-based navigation
function RoleBasedNavigation() {
  const { user, hasRole, hasAnyRole } = useAuth()

  return (
    <nav>
      <a href="/">Home</a>
      
      {user && (
        <>
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>
        </>
      )}
      
      {hasAnyRole([UserRole.MODERATOR, UserRole.ADMIN]) && (
        <a href="/moderator">Moderator Panel</a>
      )}
      
      {hasRole(UserRole.ADMIN) && (
        <a href="/admin">Admin Panel</a>
      )}
    </nav>
  )
}

export {
  AuthExample,
  UserContextExample,
  ProtectedPageExample,
  AdminOnlyExample,
  ModeratorOrAdminExample,
  ProtectedComponent,
  AdminComponent,
  ServerComponentExample,
  ProgrammaticSignInExample,
  RoleBasedNavigation
}
