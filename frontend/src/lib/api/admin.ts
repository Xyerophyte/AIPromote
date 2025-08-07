import { apiClient, ApiResponse } from './client'
import { User } from './auth'
import { Startup } from './startups'

export interface AdminStats {
  users: {
    total: number
    active: number
    newThisMonth: number
    growth: number
  }
  startups: {
    total: number
    active: number
    paused: number
    draft: number
  }
  content: {
    generated: number
    published: number
    pending: number
  }
  system: {
    uptime: number
    lastBackup: Date
    storageUsed: number
    apiCalls: number
  }
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  services: {
    database: 'connected' | 'disconnected'
    redis: 'connected' | 'disconnected'
    s3: 'connected' | 'disconnected'
    openai: 'connected' | 'disconnected'
  }
  metrics: {
    responseTime: number
    errorRate: number
    uptime: number
  }
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: Date
}

export interface SystemSettings {
  id: string
  key: string
  value: string
  description: string
  category: 'general' | 'ai' | 'limits' | 'features'
  isPublic: boolean
  updatedAt: Date
}

class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<ApiResponse<AdminStats>> {
    return apiClient.get('/api/v1/admin/stats')
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return apiClient.get('/api/v1/admin/health')
  }

  /**
   * Get all users (with pagination)
   */
  async getUsers(options?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }): Promise<ApiResponse<{
    users: User[]
    total: number
    page: number
    limit: number
  }>> {
    const params = new URLSearchParams()
    
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.search) params.append('search', options.search)
    if (options?.role) params.append('role', options.role)
    if (options?.status) params.append('status', options.status)

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/admin/users${query}`)
  }

  /**
   * Get specific user details
   */
  async getUser(userId: string): Promise<ApiResponse<User & {
    startups: Startup[]
    lastActivity: Date
    totalContent: number
  }>> {
    return apiClient.get(`/api/v1/admin/users/${userId}`)
  }

  /**
   * Update user role or status
   */
  async updateUser(userId: string, data: {
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
    status?: 'active' | 'suspended' | 'banned'
    emailVerified?: boolean
  }): Promise<ApiResponse<User>> {
    return apiClient.patch(`/api/v1/admin/users/${userId}`, data)
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/admin/users/${userId}`)
  }

  /**
   * Get all startups (admin view)
   */
  async getStartups(options?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    stage?: string
  }): Promise<ApiResponse<{
    startups: (Startup & { user: Pick<User, 'id' | 'name' | 'email'> })[]
    total: number
    page: number
    limit: number
  }>> {
    const params = new URLSearchParams()
    
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.search) params.append('search', options.search)
    if (options?.status) params.append('status', options.status)
    if (options?.stage) params.append('stage', options.stage)

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/admin/startups${query}`)
  }

  /**
   * Update startup status (admin override)
   */
  async updateStartup(startupId: string, data: {
    status?: 'draft' | 'active' | 'paused' | 'suspended'
    notes?: string
  }): Promise<ApiResponse<Startup>> {
    return apiClient.patch(`/api/v1/admin/startups/${startupId}`, data)
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(options?: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    resource?: string
    dateFrom?: Date
    dateTo?: Date
  }): Promise<ApiResponse<{
    logs: ActivityLog[]
    total: number
    page: number
    limit: number
  }>> {
    const params = new URLSearchParams()
    
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.userId) params.append('userId', options.userId)
    if (options?.action) params.append('action', options.action)
    if (options?.resource) params.append('resource', options.resource)
    if (options?.dateFrom) params.append('dateFrom', options.dateFrom.toISOString())
    if (options?.dateTo) params.append('dateTo', options.dateTo.toISOString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/admin/activity-logs${query}`)
  }

  /**
   * Get system settings
   */
  async getSettings(category?: string): Promise<ApiResponse<SystemSettings[]>> {
    const query = category ? `?category=${category}` : ''
    return apiClient.get(`/api/v1/admin/settings${query}`)
  }

  /**
   * Update system setting
   */
  async updateSetting(key: string, value: string): Promise<ApiResponse<SystemSettings>> {
    return apiClient.patch(`/api/v1/admin/settings/${key}`, { value })
  }

  /**
   * Create new system setting
   */
  async createSetting(data: {
    key: string
    value: string
    description: string
    category: 'general' | 'ai' | 'limits' | 'features'
    isPublic?: boolean
  }): Promise<ApiResponse<SystemSettings>> {
    return apiClient.post('/api/v1/admin/settings', data)
  }

  /**
   * Delete system setting
   */
  async deleteSetting(key: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/admin/settings/${key}`)
  }

  /**
   * Backup database
   */
  async backupDatabase(): Promise<ApiResponse<{ message: string, backupId: string }>> {
    return apiClient.post('/api/v1/admin/backup')
  }

  /**
   * Get backup list
   */
  async getBackups(): Promise<ApiResponse<{
    id: string
    filename: string
    size: number
    createdAt: Date
  }[]>> {
    return apiClient.get('/api/v1/admin/backups')
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/api/v1/admin/backups/${backupId}/restore`)
  }

  /**
   * Send system notification to all users
   */
  async sendNotification(data: {
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    targetUsers?: string[]
    scheduledAt?: Date
  }): Promise<ApiResponse<{ message: string, notificationId: string }>> {
    return apiClient.post('/api/v1/admin/notifications', data)
  }

  /**
   * Get content moderation queue
   */
  async getModerationQueue(options?: {
    page?: number
    limit?: number
    status?: 'pending' | 'approved' | 'rejected'
    platform?: string
  }): Promise<ApiResponse<{
    content: any[]
    total: number
    page: number
    limit: number
  }>> {
    const params = new URLSearchParams()
    
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.status) params.append('status', options.status)
    if (options?.platform) params.append('platform', options.platform)

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/admin/moderation${query}`)
  }

  /**
   * Moderate content
   */
  async moderateContent(contentId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/api/v1/admin/moderation/${contentId}`, { action, reason })
  }

  /**
   * Generate admin report
   */
  async generateReport(type: 'users' | 'content' | 'system', options?: {
    dateFrom?: Date
    dateTo?: Date
    format?: 'json' | 'csv' | 'pdf'
  }): Promise<ApiResponse<{
    reportId: string
    downloadUrl?: string
    data?: any
  }>> {
    return apiClient.post(`/api/v1/admin/reports/${type}`, options)
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(): Promise<ApiResponse<Record<string, boolean>>> {
    return apiClient.get('/api/v1/admin/feature-flags')
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(flag: string, enabled: boolean): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch(`/api/v1/admin/feature-flags/${flag}`, { enabled })
  }
}

export const adminService = new AdminService()
