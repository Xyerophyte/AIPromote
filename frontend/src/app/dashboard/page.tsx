"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { startupsService, contentService, api } from '@/lib/api'
import type { Startup } from '@/lib/api'

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

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔄 Loading dashboard data...')
        
        // Load startups
        const startupsResponse = await startupsService.getStartups()
        const startups = startupsResponse.success ? startupsResponse.data || [] : []
        
        // Load recent content for all startups
        let recentContent: any[] = []
        if (startups.length > 0) {
          for (const startup of startups.slice(0, 3)) { // Limit to first 3 startups
            const contentResponse = await contentService.getContent(startup.id, { 
              limit: 5, 
              status: 'published' 
            })
            if (contentResponse.success && contentResponse.data) {
              recentContent = [...recentContent, ...contentResponse.data.content]
            }
          }
        }
        
        // Calculate stats
        const stats = {
          totalStartups: startups.length,
          activeStartups: startups.filter(s => s.status === 'active').length,
          totalContent: recentContent.length,
          publishedContent: recentContent.filter(c => c.status === 'published').length
        }
        
        setDashboardData({
          startups,
          recentContent: recentContent.slice(0, 10), // Show latest 10
          stats
        })
        
        console.log('✅ Dashboard data loaded successfully')
        
      } catch (err) {
        console.error('❌ Failed to load dashboard data:', err)
        setError('Failed to load dashboard data. Please try refreshing the page.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user && !authLoading) {
      loadDashboardData()
    }
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Loading Dashboard...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 text-blue-600">Total Startups</h3>
                  <p className="text-3xl font-bold">{dashboardData?.stats.totalStartups || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 text-green-600">Active Startups</h3>
                  <p className="text-3xl font-bold">{dashboardData?.stats.activeStartups || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 text-purple-600">Total Content</h3>
                  <p className="text-3xl font-bold">{dashboardData?.stats.totalContent || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 text-orange-600">Published Content</h3>
                  <p className="text-3xl font-bold">{dashboardData?.stats.publishedContent || 0}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Start New Intake</h3>
                  <p className="text-gray-600 mb-4">Complete the founder intake form for a new startup</p>
                  <Button asChild size="sm">
                    <Link href="/intake">
                      Start Intake
                    </Link>
                  </Button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Generate Content</h3>
                  <p className="text-gray-600 mb-4">Create AI-powered social media content</p>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/content/generate">
                      Generate Content
                    </Link>
                  </Button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">View Analytics</h3>
                  <p className="text-gray-600 mb-4">Track performance and engagement metrics</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/analytics">
                      View Analytics
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Startups List */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Your Startups</h3>
                </div>
                <div className="p-6">
                  {dashboardData?.startups && dashboardData.startups.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardData.startups.map((startup) => (
                        <div key={startup.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{startup.name}</h4>
                              <p className="text-gray-600 text-sm">{startup.tagline || 'No tagline provided'}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  startup.status === 'active' ? 'bg-green-100 text-green-800' :
                                  startup.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {startup.status.charAt(0).toUpperCase() + startup.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {startup.stage.charAt(0).toUpperCase() + startup.stage.slice(1)} Stage
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/startups/${startup.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              {!startup.intakeData && (
                                <Button asChild size="sm">
                                  <Link href={`/intake?startupId=${startup.id}`}>
                                    Complete Intake
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No startups found. Get started by completing the intake form!</p>
                      <Button asChild>
                        <Link href="/intake">
                          Start Your First Intake
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Panel Access */}
              {user?.role === "ADMIN" && (
                <div className="bg-white rounded-lg shadow mb-8">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Admin Tools</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button asChild variant="outline">
                        <Link href="/admin">Admin Dashboard</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/admin/users">Manage Users</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/admin/startups">Manage Startups</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/admin/settings">System Settings</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {dashboardData?.recentContent && dashboardData.recentContent.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Recent Content</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {dashboardData.recentContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <h5 className="font-medium">{content.title || 'Untitled Content'}</h5>
                            <p className="text-sm text-gray-600">{content.platform} • {content.type}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            content.status === 'published' ? 'bg-green-100 text-green-800' :
                            content.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            content.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {content.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
