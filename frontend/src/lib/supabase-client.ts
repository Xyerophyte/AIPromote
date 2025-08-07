'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Hook to manage Supabase session sync with NextAuth
 */
export function useSupabaseSession() {
  const { data: session, status } = useSession()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    const setupSession = async () => {
      if (session?.user) {
        // Set up Supabase session with NextAuth session data
        const { data, error } = await supabase.auth.setSession({
          access_token: session.user.id, // Use user ID as token for simplicity
          refresh_token: 'refresh_token_placeholder'
        })

        if (!error) {
          setIsConnected(true)
          console.log('✅ Supabase session established')
        } else {
          console.error('❌ Supabase session error:', error)
          setIsConnected(false)
        }
      } else {
        // Clear Supabase session
        await supabase.auth.signOut()
        setIsConnected(false)
        console.log('🔒 Supabase session cleared')
      }
    }

    setupSession()
  }, [session, status])

  return { isConnected, supabase }
}

/**
 * Real-time subscription hook for Supabase
 */
export function useSupabaseSubscription<T = any>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const { isConnected } = useSupabaseSession()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) return

    let subscription: any

    const setupSubscription = async () => {
      try {
        // Initial data fetch
        let query = supabase.from(table).select('*')
        
        if (filter) {
          // Apply filter if provided
          const [column, operator, value] = filter.split(' ')
          query = query.filter(column, operator, value)
        }

        const { data: initialData, error: fetchError } = await query

        if (fetchError) {
          setError(fetchError.message)
          setLoading(false)
          return
        }

        setData(initialData || [])
        setError(null)
        setLoading(false)

        // Set up real-time subscription
        subscription = supabase
          .channel(`${table}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter
            },
            (payload) => {
              console.log(`🔄 Real-time update for ${table}:`, payload)
              
              if (payload.eventType === 'INSERT') {
                setData(prev => [...prev, payload.new as T])
              } else if (payload.eventType === 'UPDATE') {
                setData(prev => prev.map(item => 
                  (item as any).id === payload.new.id ? payload.new as T : item
                ))
              } else if (payload.eventType === 'DELETE') {
                setData(prev => prev.filter(item => 
                  (item as any).id !== payload.old.id
                ))
              }

              // Call custom callback if provided
              callback?.(payload)
            }
          )
          .subscribe()

        console.log(`✅ Subscribed to ${table} changes`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Subscription error')
        setLoading(false)
      }
    }

    setupSubscription()

    // Cleanup subscription
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
        console.log(`🔌 Unsubscribed from ${table} changes`)
      }
    }
  }, [isConnected, table, filter, callback])

  return { data, loading, error, isConnected }
}

/**
 * Simplified insert operation with real-time updates
 */
export async function insertWithRealtime<T>(
  table: string,
  data: Partial<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: result as T, error: null }
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Insert operation failed' 
    }
  }
}

/**
 * Simplified update operation with real-time updates
 */
export async function updateWithRealtime<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: result as T, error: null }
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Update operation failed' 
    }
  }
}

/**
 * Simplified delete operation with real-time updates
 */
export async function deleteWithRealtime(
  table: string,
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Delete operation failed' 
    }
  }
}

export type RealtimePayload<T = any> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
}
