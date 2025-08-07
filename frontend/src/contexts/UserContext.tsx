"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { UserRole } from "@/types/auth"

interface User {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role: UserRole
  emailVerified: Date | null
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status, update } = useSession()
  const [user, setUser] = useState<User | null>(null)

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated" && !!session?.user

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
      })
    } else {
      setUser(null)
    }
  }, [session])

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

  const refreshUser = async (): Promise<void> => {
    await update()
  }

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    refreshUser,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
