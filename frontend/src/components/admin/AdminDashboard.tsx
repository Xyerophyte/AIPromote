'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCounter, AnimatedPercentage } from '@/components/ui/animated-counter'
import { AnimatedProgress, CircularProgress, AnimatedGauge } from '@/components/ui/animated-progress'
import { AnimatedBarChart, AnimatedLineChart, AnimatedDonutChart } from '@/components/ui/animated-chart'
import { AnimatedTooltip, StatCardWithTooltip } from '@/components/ui/animated-tooltip'
import { EnhancedDashboardSkeleton, ChartSkeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  userGrowth: number
  contentCreated: number
  postsPublished: number
  activeSubscriptions: number
  recentErrors: number
  timeframe: string
  generatedAt: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  plan: string
  verified: boolean
  createdAt: string
}

interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  checks: Record<string, any>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'system'>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [timeframe, setTimeframe] = useState('30d')
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
    fetchSystemHealth()
    const interval = setInterval(fetchSystemHealth, 30000) // Check system health every 30 seconds
    return () => clearInterval(interval)
  }, [timeframe])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/dashboard?timeframe=${timeframe}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system/health')
      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const exportData = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}&timeframe=${timeframe}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.name.toLowerCase().includes(userSearch.toLowerCase())
  )

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'border-green-500 bg-green-50'
      case 'WARNING':
        return 'border-yellow-500 bg-yellow-50'
      case 'CRITICAL':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">System overview and management</p>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth && systemHealth.status !== 'HEALTHY' && (
          <div className={`border-l-4 p-4 mb-6 ${getHealthStatusColor(systemHealth.status)}`}>
            <div className="flex items-center gap-2">
              {getHealthStatusIcon(systemHealth.status)}
              <h3 className="font-semibold">
                System Health: {systemHealth.status}
              </h3>
            </div>
            <p className="text-sm mt-1">
              Some system components require attention. Check the System tab for details.
            </p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-6 mb-8 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'content', label: 'Content', icon: FileText },
            { id: 'system', label: 'System', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                if (tab.id === 'users') fetchUsers()
              }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EnhancedDashboardSkeleton />
              </motion.div>
            ) : stats ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Animated Stats Cards */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <StatCardWithTooltip
                      title="New Users"
                      value={stats.userGrowth}
                      change={12}
                      changeLabel="Growth in new user signups"
                      icon={<Users className="h-6 w-6" />}
                      color="blue"
                      tooltip="Number of new users registered in the selected timeframe"
                    />
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <StatCardWithTooltip
                      title="Content Created"
                      value={stats.contentCreated}
                      change={8}
                      changeLabel="Increase in content generation"
                      icon={<FileText className="h-6 w-6" />}
                      color="green"
                      tooltip="Total content pieces generated using AI tools"
                    />
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <StatCardWithTooltip
                      title="Posts Published"
                      value={stats.postsPublished}
                      change={15}
                      changeLabel="More posts published to social platforms"
                      icon={<BarChart3 className="h-6 w-6" />}
                      color="purple"
                      tooltip="Number of posts successfully published across all platforms"
                    />
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <StatCardWithTooltip
                      title="Active Subscriptions"
                      value={stats.activeSubscriptions}
                      change={5}
                      changeLabel="Growth in active paid subscriptions"
                      icon={<Shield className="h-6 w-6" />}
                      color="orange"
                      tooltip="Number of users with active premium subscriptions"
                    />
                  </motion.div>
                </motion.div>

                {/* Charts and Analytics Section */}
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {/* User Growth Chart */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">User Growth Trend</h3>
                      <AnimatedTooltip content="Daily new user registrations over time">
                        <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold cursor-help">
                          ?
                        </div>
                      </AnimatedTooltip>
                    </div>
                    <AnimatedLineChart
                      data={[
                        { x: 1, y: 120, label: 'Week 1: 120 users' },
                        { x: 2, y: 135, label: 'Week 2: 135 users' },
                        { x: 3, y: 148, label: 'Week 3: 148 users' },
                        { x: 4, y: 162, label: 'Week 4: 162 users' },
                        { x: 5, y: stats.userGrowth, label: `Current: ${stats.userGrowth} users` }
                      ]}
                      width={400}
                      height={250}
                      strokeColor="#3b82f6"
                    />
                  </div>

                  {/* Content Distribution Chart */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Content Types</h3>
                      <AnimatedTooltip content="Distribution of different content types created">
                        <div className="h-4 w-4 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold cursor-help">
                          ?
                        </div>
                      </AnimatedTooltip>
                    </div>
                    <div className="flex justify-center">
                      <AnimatedDonutChart
                        data={[
                          { label: 'Blog Posts', value: 45, color: '#8b5cf6' },
                          { label: 'Social Media', value: 30, color: '#06d6a0' },
                          { label: 'Emails', value: 15, color: '#f59e0b' },
                          { label: 'Other', value: 10, color: '#ef4444' }
                        ]}
                        size={200}
                        thickness={25}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">Server Performance</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>CPU Usage</span>
                          <span>65%</span>
                        </div>
                        <AnimatedProgress value={65} color="blue" showPercentage={false} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Memory Usage</span>
                          <span>78%</span>
                        </div>
                        <AnimatedProgress value={78} color="yellow" showPercentage={false} delay={0.2} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Storage</span>
                          <span>42%</span>
                        </div>
                        <AnimatedProgress value={42} color="green" showPercentage={false} delay={0.4} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">API Response Times</h4>
                    <div className="flex justify-center">
                      <CircularProgress
                        value={92}
                        size={120}
                        color="#10b981"
                        showPercentage={false}
                      />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-2xl font-bold text-gray-800">245ms</div>
                      <div className="text-sm text-gray-600">Average Response</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-600 mb-4">System Health Score</h4>
                    <div className="flex justify-center">
                      <AnimatedGauge
                        value={87}
                        max={100}
                        label="Health Score"
                        size={140}
                        colors={['#ef4444', '#f59e0b', '#10b981']}
                      />
                    </div>
                  </div>
              </motion.div>

                {/* Quick Actions */}
                <motion.div
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => exportData('users')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Users
                    </Button>
                    <Button onClick={() => exportData('content')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Content
                    </Button>
                    <Button onClick={() => exportData('analytics')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                    <Button onClick={() => router.push('/admin/notifications')} variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Notification
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* User Search */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by email or name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="USER">User</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && systemHealth && (
          <div>
            <div className="grid gap-6">
              {/* Overall Status */}
              <div className={`rounded-lg p-6 border ${getHealthStatusColor(systemHealth.status)}`}>
                <div className="flex items-center gap-3 mb-4">
                  {getHealthStatusIcon(systemHealth.status)}
                  <h3 className="text-lg font-semibold">
                    System Status: {systemHealth.status}
                  </h3>
                </div>
                <p className="text-sm">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>

              {/* Individual Health Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(systemHealth.checks).map(([check, data]) => (
                  <div key={check} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {getHealthStatusIcon(data.status)}
                      <h4 className="font-medium capitalize">{check.replace(/([A-Z])/g, ' $1')}</h4>
                    </div>
                    {data.message && (
                      <p className="text-sm text-gray-600 mb-2">{data.message}</p>
                    )}
                    {data.value !== undefined && (
                      <p className="text-xs text-gray-500">
                        Value: {data.value} {data.unit}
                      </p>
                    )}
                    {data.count !== undefined && (
                      <p className="text-xs text-gray-500">
                        Count: {data.count}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* System Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={fetchSystemHealth} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Health Check
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download System Logs
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
