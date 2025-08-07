import { apiClient, ApiResponse } from './client'
import { CompleteIntake } from '@/lib/validations/intake'

export interface Startup {
  id: string
  userId: string
  name: string
  url?: string
  tagline?: string
  description?: string
  category?: string
  stage: 'idea' | 'mvp' | 'growth' | 'scale'
  status: 'draft' | 'active' | 'paused'
  intakeData?: CompleteIntake
  createdAt: Date
  updatedAt: Date
}

export interface CreateStartupData {
  name: string
  url?: string
  tagline?: string
  description?: string
  category?: string
  stage?: 'idea' | 'mvp' | 'growth' | 'scale'
}

export interface UpdateStartupData extends Partial<CreateStartupData> {
  intakeData?: CompleteIntake
  status?: 'draft' | 'active' | 'paused'
}

class StartupsService {
  /**
   * Get all startups for current user
   */
  async getStartups(): Promise<ApiResponse<Startup[]>> {
    return apiClient.get('/api/v1/startups')
  }

  /**
   * Get a specific startup by ID
   */
  async getStartup(id: string): Promise<ApiResponse<Startup>> {
    return apiClient.get(`/api/v1/startups/${id}`)
  }

  /**
   * Create a new startup
   */
  async createStartup(data: CreateStartupData): Promise<ApiResponse<Startup>> {
    return apiClient.post('/api/v1/startups', data)
  }

  /**
   * Update an existing startup
   */
  async updateStartup(id: string, data: UpdateStartupData): Promise<ApiResponse<Startup>> {
    return apiClient.put(`/api/v1/startups/${id}`, data)
  }

  /**
   * Delete a startup
   */
  async deleteStartup(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/startups/${id}`)
  }

  /**
   * Submit complete intake form
   */
  async submitIntake(intakeData: CompleteIntake, startupId?: string): Promise<ApiResponse<Startup>> {
    if (startupId) {
      // Update existing startup with intake data
      return this.updateStartup(startupId, { intakeData, status: 'active' })
    } else {
      // Create new startup from intake data
      const startupData: CreateStartupData = {
        name: intakeData.startupBasics.name || 'Untitled Startup',
        url: intakeData.startupBasics.url,
        tagline: intakeData.startupBasics.tagline,
        description: intakeData.startupBasics.description,
        category: intakeData.startupBasics.category,
        stage: intakeData.startupBasics.stage as 'idea' | 'mvp' | 'growth' | 'scale' | undefined
      }
      
      const response = await this.createStartup(startupData)
      
      if (response.success && response.data) {
        // Update the newly created startup with full intake data
        return this.updateStartup(response.data.id, { 
          intakeData, 
          status: 'active' 
        })
      }
      
      return response
    }
  }

  /**
   * Save intake draft
   */
  async saveIntakeDraft(startupId: string, draftData: Partial<CompleteIntake>): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/api/v1/startups/${startupId}/intake-draft`, draftData)
  }

  /**
   * Load intake draft
   */
  async loadIntakeDraft(startupId: string): Promise<ApiResponse<Partial<CompleteIntake>>> {
    return apiClient.get(`/api/v1/startups/${startupId}/intake-draft`)
  }

  /**
   * Generate AI strategy for a startup
   */
  async generateStrategy(startupId: string, options?: {
    platforms?: string[]
    timeframe?: number
    includeContent?: boolean
  }): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/startups/${startupId}/generate-strategy`, options)
  }

  /**
   * Get startup analytics
   */
  async getAnalytics(startupId: string, timeframe?: string): Promise<ApiResponse<any>> {
    const params = timeframe ? `?timeframe=${timeframe}` : ''
    return apiClient.get(`/api/v1/startups/${startupId}/analytics${params}`)
  }
}

export const startupsService = new StartupsService()
