"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode, useEffect } from "react"
import { useSupabaseSession } from "@/lib/supabase-client"

interface AuthProviderProps {
  children: ReactNode
  session?: any
}

// Inner component to handle Supabase session sync
function SupabaseSessionSync({ children }: { children: ReactNode }) {
  const { isConnected } = useSupabaseSession()
  
  useEffect(() => {
    if (isConnected) {
      console.log('🔌 Real-time features enabled via Supabase')
    }
  }, [isConnected])
  
  return <>{children}</>
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={60 * 5} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      <SupabaseSessionSync>
        {children}
      </SupabaseSessionSync>
    </SessionProvider>
  )
}
