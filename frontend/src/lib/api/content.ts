import { apiClient, ApiResponse } from './client'

export interface ContentPiece {
  id: string
  startupId: string
  type: 'post' | 'thread' | 'carousel' | 'article' | 'video'
  platform: 'twitter' | 'linkedin' | 'blog' | 'medium'
  title?: string
  content: string
  status: 'draft' | 'approved' | 'published' | 'archived'
  scheduledAt?: Date
  publishedAt?: Date
  metrics?: {
    views?: number
    likes?: number
    shares?: number
    comments?: number
    clicks?: number
  }
  tags?: string[]
  mediaFiles?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ContentGenerationRequest {
  startupId: string
  contentType: 'post' | 'thread' | 'carousel' | 'article' | 'video'
  platform: 'twitter' | 'linkedin' | 'blog' | 'medium'
  topic?: string
  tone?: 'professional' | 'casual' | 'expert' | 'friendly'
  length?: 'short' | 'medium' | 'long'
  includeHashtags?: boolean
  includeEmojis?: boolean
  targetAudience?: string
  callToAction?: string
  references?: string[]
}

export interface BulkContentRequest {
  startupId: string
  contentPlan: {
    platform: string
    contentTypes: string[]
    topics: string[]
    quantity: number
    timeframe: 'week' | 'month' | 'quarter'
  }
}

export interface ContentTemplate {
  id: string
  name: string
  type: string
  platform: string
  template: string
  variables: string[]
  isDefault: boolean
}

class ContentService {
  /**
   * Get all content for a startup
   */
  async getContent(startupId: string, filters?: {
    platform?: string
    status?: string
    type?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ content: ContentPiece[], total: number }>> {
    const params = new URLSearchParams()
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/content/${startupId}${query}`)
  }

  /**
   * Get a specific content piece
   */
  async getContentPiece(id: string): Promise<ApiResponse<ContentPiece>> {
    return apiClient.get(`/api/v1/content/piece/${id}`)
  }

  /**
   * Generate new content using AI
   */
  async generateContent(request: ContentGenerationRequest): Promise<ApiResponse<ContentPiece>> {
    return apiClient.post('/api/v1/content/generate', request)
  }

  /**
   * Generate multiple content pieces
   */
  async generateBulkContent(request: BulkContentRequest): Promise<ApiResponse<ContentPiece[]>> {
    return apiClient.post('/api/v1/content/generate-bulk', request)
  }

  /**
   * Create content manually
   */
  async createContent(data: {
    startupId: string
    type: string
    platform: string
    title?: string
    content: string
    tags?: string[]
    scheduledAt?: Date
  }): Promise<ApiResponse<ContentPiece>> {
    return apiClient.post('/api/v1/content', data)
  }

  /**
   * Update content
   */
  async updateContent(id: string, data: Partial<{
    title: string
    content: string
    status: string
    scheduledAt: Date
    tags: string[]
  }>): Promise<ApiResponse<ContentPiece>> {
    return apiClient.put(`/api/v1/content/${id}`, data)
  }

  /**
   * Delete content
   */
  async deleteContent(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/content/${id}`)
  }

  /**
   * Approve content for publishing
   */
  async approveContent(id: string): Promise<ApiResponse<ContentPiece>> {
    return apiClient.post(`/api/v1/content/${id}/approve`)
  }

  /**
   * Schedule content for publishing
   */
  async scheduleContent(id: string, scheduledAt: Date): Promise<ApiResponse<ContentPiece>> {
    return apiClient.post(`/api/v1/content/${id}/schedule`, { scheduledAt })
  }

  /**
   * Publish content immediately
   */
  async publishContent(id: string): Promise<ApiResponse<ContentPiece>> {
    return apiClient.post(`/api/v1/content/${id}/publish`)
  }

  /**
   * Get content templates
   */
  async getTemplates(platform?: string): Promise<ApiResponse<ContentTemplate[]>> {
    const query = platform ? `?platform=${platform}` : ''
    return apiClient.get(`/api/v1/content/templates${query}`)
  }

  /**
   * Create content template
   */
  async createTemplate(data: {
    name: string
    type: string
    platform: string
    template: string
    variables: string[]
  }): Promise<ApiResponse<ContentTemplate>> {
    return apiClient.post('/api/v1/content/templates', data)
  }

  /**
   * Use template to generate content
   */
  async useTemplate(templateId: string, variables: Record<string, string>): Promise<ApiResponse<ContentPiece>> {
    return apiClient.post(`/api/v1/content/templates/${templateId}/use`, { variables })
  }

  /**
   * Get content calendar
   */
  async getCalendar(startupId: string, month?: string, year?: string): Promise<ApiResponse<{
    scheduled: ContentPiece[]
    published: ContentPiece[]
  }>> {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    if (year) params.append('year', year)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get(`/api/v1/content/${startupId}/calendar${query}`)
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(startupId: string, timeframe?: string): Promise<ApiResponse<{
    totalContent: number
    published: number
    pending: number
    engagement: {
      views: number
      likes: number
      shares: number
      comments: number
    }
    topPerforming: ContentPiece[]
    platformBreakdown: Record<string, number>
  }>> {
    const query = timeframe ? `?timeframe=${timeframe}` : ''
    return apiClient.get(`/api/v1/content/${startupId}/analytics${query}`)
  }
}

export const contentService = new ContentService()
