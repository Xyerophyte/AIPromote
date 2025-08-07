'use client'

import React, { useState } from 'react'
import { useSupabaseSubscription } from '@/lib/supabase-client'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, Briefcase, TrendingUp } from 'lucide-react'

interface DashboardData {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused'
  created_at: string
  updated_at: string
  user_id: string
}

interface ActivityLog {
  id: string
  action: string
  details: string
  timestamp: string
  user_id: string
}

export default function RealtimeDashboard() {
  const { data: session } = useSession()
  const [refreshKey, setRefreshKey] = useState(0)

  // Subscribe to user's startups with real-time updates
  const {
    data: startups,
    loading: startupsLoading,
    error: startupsError,
    isConnected
  } = useSupabaseSubscription<DashboardData>(
    'startups',
    session?.user?.id ? `user_id eq ${session.user.id}` : undefined,
    (payload) => {
      console.log('📊 Startup update:', payload)
      // Custom handling for real-time updates
      if (payload.eventType === 'INSERT') {
        console.log('✅ New startup created')
      }
    }
  )

  // Subscribe to activity logs
  const {
    data: activities,
    loading: activitiesLoading,
    error: activitiesError
  } = useSupabaseSubscription<ActivityLog>(
    'activity_logs',
    session?.user?.id ? `user_id eq ${session.user.id}` : undefined,
    (payload) => {
      console.log('📝 Activity update:', payload)
    }
  )

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!session?.user) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view your dashboard.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
              {isConnected ? 'Real-time connected' : 'Disconnected'}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Startups</p>
              <p className="text-2xl font-bold">
                {startupsLoading ? (
                  <LoadingSpinner size="sm" inline />
                ) : (
                  startups?.length || 0
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">
                {startupsLoading ? (
                  <LoadingSpinner size="sm" inline />
                ) : (
                  startups?.filter(s => s.status === 'active').length || 0
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recent Activities</p>
              <p className="text-2xl font-bold">
                {activitiesLoading ? (
                  <LoadingSpinner size="sm" inline />
                ) : (
                  activities?.length || 0
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Startups List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Startups</h2>
            {startupsLoading && (
              <LoadingSpinner size="sm" color="primary" />
            )}
          </div>

          {startupsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                Error loading startups: {startupsError}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {startups && startups.length > 0 ? (
              startups.map((startup) => (
                <div 
                  key={startup.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{startup.name}</h3>
                    <p className="text-sm text-gray-600">
                      Created {formatDate(startup.created_at)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(startup.status)}>
                    {startup.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No startups found</p>
                <p className="text-sm">Create your first startup to get started</p>
              </div>
            )}
          </div>
        </Card>

        {/* Activity Log */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {activitiesLoading && (
              <LoadingSpinner size="sm" color="primary" />
            )}
          </div>

          {activitiesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                Error loading activities: {activitiesError}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {activities && activities.length > 0 ? (
              activities.slice(0, 10).map((activity) => (
                <div 
                  key={activity.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{activity.action}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here as you use the app</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
