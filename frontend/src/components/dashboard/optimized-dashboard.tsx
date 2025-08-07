"use client"

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useAuth } from "@/hooks/use-auth"
import { Button } from "../ui/button"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { startupsService, contentService, apiClient, type Startup } from '@/lib/api'
import { cache, cacheKeys, cacheTTL, cacheTags } from '@/lib/cache/redis'

// Lazy loaded components
const StatsCards = lazy(() => import('./stats-cards'))
const QuickActions = lazy(() => import('./quick-actions'))
const StartupsList = lazy(() => import('./startups-list'))
const RecentContent = lazy(() => import('./recent-content'))
const AdminPanel = lazy(() => import('./admin-panel'))

interface DashboardData {
  startups: Startup[]
  recentContent: any[]
  stats: {
    totalStartups: number
    activeStartups: number
    totalContent: number
    publishedContent: number
  }
}

interface OptimizedDashboardProps {
  initialData?: Partial<DashboardData>
}

// Memoized loading skeleton
const LoadingSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
      ))}
    </div>
    <div className="bg-gray-200 h-64 rounded-lg mb-8"></div>
    <div className="bg-gray-200 h-48 rounded-lg"></div>
  </div>
))

// Memoized error boundary
const ErrorFallback = React.memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
    <p className="text-red-600 mb-4">{error}</p>
    <Button onClick={onRetry}>Retry</Button>
  </div>
))

export default function OptimizedDashboard({ initialData }: OptimizedDashboardProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    initialData as DashboardData || null
  )
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  // Memoized cache keys
  const cacheKeysForUser = useMemo(() => {
    if (!user?.id) return null
    return {
      startups: cacheKeys.startupList(user.id),
      dashboardStats: cacheKeys.dashboardStats(user.id),
      content: (startupId: string) => cacheKeys.content(startupId, 'recent')
    }
  }, [user?.id])

  // Optimized data loading with caching
  const loadDashboardData = useCallback(async () => {
    if (!user || !cacheKeysForUser) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 Loading optimized dashboard data...')
      
      // Use batch requests for better performance
      const batchRequests = [
        {
          id: 'startups',
          endpoint: '/api/startups',
          options: {
            cache: {
              enabled: true,
              ttl: cacheTTL.LONG,
              tags: [cacheTags.STARTUP, cacheTags.USER],
              key: cacheKeysForUser.startups
            }
          }
        }
      ]
      
      // Load startups with caching
      const startupsResponse = await apiClient.getCached(
        '/api/startups',
        {
          ttl: cacheTTL.LONG,
          tags: [cacheTags.STARTUP, cacheTags.USER],
          key: cacheKeysForUser.startups
        }
      )
      
      const startups = startupsResponse.success ? startupsResponse.data || [] : []
      
      // Load content for first 3 startups in parallel with caching
      const contentPromises = startups.slice(0, 3).map(startup => 
        apiClient.getCached(
          `/api/startups/${startup.id}/content?limit=5&status=published`,
          {
            ttl: cacheTTL.MEDIUM,
            tags: [cacheTags.CONTENT, cacheTags.STARTUP],
            key: cacheKeysForUser.content(startup.id)
          }
        )
      )
      
      const contentResponses = await Promise.allSettled(contentPromises)
      let recentContent: any[] = []
      
      contentResponses.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          recentContent = [...recentContent, ...result.value.data.content]
        }
      })
      
      // Calculate stats
      const stats = {
        totalStartups: startups.length,
        activeStartups: startups.filter(s => s.status === 'active').length,
        totalContent: recentContent.length,
        publishedContent: recentContent.filter(c => c.status === 'published').length
      }
      
      // Cache dashboard stats
      await cache.set(cacheKeysForUser.dashboardStats, stats, {
        ttl: cacheTTL.MEDIUM,
        tags: [cacheTags.DASHBOARD, cacheTags.USER]
      })
      
      const newDashboardData = {
        startups,
        recentContent: recentContent.slice(0, 10),
        stats
      }
      
      setDashboardData(newDashboardData)
      console.log('✅ Optimized dashboard data loaded successfully')
      
    } catch (err) {
      console.error('❌ Failed to load dashboard data:', err)
      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setIsLoading(false)
    }
  }, [user, cacheKeysForUser])

  // Load data when user is available
  useEffect(() => {
    if (user && !authLoading && !initialData) {
      loadDashboardData()
    }
  }, [user, authLoading, loadDashboardData, initialData])

  // Memoized user info
  const userInfo = useMemo(() => ({
    name: user?.name,
    role: user?.role
  }), [user?.name, user?.role])

  // Handle retry
  const handleRetry = useCallback(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (authLoading || (isLoading && !dashboardData)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Loading Dashboard...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <ErrorFallback error={error} onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {userInfo.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {userInfo.role}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <Suspense fallback={<div className="grid grid-cols-4 gap-6 mb-8 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 h-24 rounded-lg" />)}
          </div>}>
            <StatsCards stats={dashboardData?.stats} />
          </Suspense>

          {/* Quick Actions */}
          <Suspense fallback={<div className="bg-gray-200 h-48 rounded-lg mb-8 animate-pulse" />}>
            <QuickActions />
          </Suspense>

          {/* Startups List */}
          <Suspense fallback={<div className="bg-gray-200 h-64 rounded-lg mb-8 animate-pulse" />}>
            <StartupsList startups={dashboardData?.startups || []} />
          </Suspense>

          {/* Admin Panel - Only for admins */}
          {userInfo.role === "ADMIN" && (
            <Suspense fallback={<div className="bg-gray-200 h-32 rounded-lg mb-8 animate-pulse" />}>
              <AdminPanel />
            </Suspense>
          )}

          {/* Recent Content */}
          {dashboardData?.recentContent && dashboardData.recentContent.length > 0 && (
            <Suspense fallback={<div className="bg-gray-200 h-48 rounded-lg animate-pulse" />}>
              <RecentContent content={dashboardData.recentContent} />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  )
}
