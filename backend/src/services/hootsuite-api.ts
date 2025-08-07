import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { decrypt } from '../utils/encryption';

export interface HootsuiteCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface HootsuiteProfile {
  id: string;
  socialNetworkId: string;
  socialNetworkUsername: string;
  socialNetworkType: string;
  timeZone: string;
  profileUrl: string;
}

export interface HootsuiteMessage {
  text?: string;
  media?: Array<{
    id: string;
    type: 'photo' | 'video' | 'gif';
    url: string;
  }>;
  tags?: string[];
  emailNotification?: boolean;
}

export interface HootsuiteScheduledMessage {
  id: string;
  state: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduledSendTime: string;
  message: HootsuiteMessage;
  socialProfileIds: string[];
  createdDate: string;
}

export interface HootsuiteAnalytics {
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  followerGrowth?: number;
}

export interface HootsuiteMedia {
  id: string;
  state: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  downloadUrl?: string;
  sizeBytes?: number;
  mimeType?: string;
}

export class HootsuiteService {
  private client: AxiosInstance;
  private accessToken: string;
  private refreshToken?: string;

  constructor(credentials: HootsuiteCredentials) {
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken;
    
    this.client = axios.create({
      baseURL: 'https://platform.hootsuite.com/v1',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Hootsuite API Error:', error.response?.data || error.message);
        throw new Error(`Hootsuite API Error: ${error.response?.data?.error?.message || error.message}`);
      }
    );
  }

  /**
   * Create a new Hootsuite client with decrypted credentials
   */
  static async createWithEncryptedCredentials(
    encryptedAccessToken: string,
    encryptedRefreshToken?: string,
    expiresAt?: Date
  ): Promise<HootsuiteService> {
    const credentials: HootsuiteCredentials = {
      accessToken: decrypt(encryptedAccessToken),
      refreshToken: encryptedRefreshToken ? decrypt(encryptedRefreshToken) : undefined,
      expiresAt,
    };
    
    return new HootsuiteService(credentials);
  }

  /**
   * Get current user info
   */
  async getMe(): Promise<any> {
    try {
      const response = await this.client.get('/me');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      throw new Error(`Failed to fetch user info: ${error.message}`);
    }
  }

  /**
   * Get user's social media profiles
   */
  async getSocialProfiles(): Promise<HootsuiteProfile[]> {
    try {
      const response = await this.client.get('/socialProfiles');
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching social profiles:', error);
      throw new Error(`Failed to fetch social profiles: ${error.message}`);
    }
  }

  /**
   * Get specific social profile
   */
  async getSocialProfile(profileId: string): Promise<HootsuiteProfile> {
    try {
      const response = await this.client.get(`/socialProfiles/${profileId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching social profile:', error);
      throw new Error(`Failed to fetch social profile: ${error.message}`);
    }
  }

  /**
   * Upload media file
   */
  async uploadMedia(mediaUrl: string, mediaType: 'photo' | 'video' | 'gif'): Promise<HootsuiteMedia> {
    try {
      // Step 1: Create media upload session
      const uploadResponse = await this.client.post('/media', {
        sizeBytes: 0, // Will be filled by Hootsuite
        mimeType: this.getMimeType(mediaType),
      });

      const mediaId = uploadResponse.data.data.id;
      const uploadUrl = uploadResponse.data.data.uploadUrl;

      // Step 2: Download media from URL and upload to Hootsuite
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      
      await axios.put(uploadUrl, mediaResponse.data, {
        headers: {
          'Content-Type': this.getMimeType(mediaType),
        },
      });

      // Step 3: Get uploaded media info
      const mediaInfo = await this.getMedia(mediaId);
      return mediaInfo;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Get media information
   */
  async getMedia(mediaId: string): Promise<HootsuiteMedia> {
    try {
      const response = await this.client.get(`/media/${mediaId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching media:', error);
      throw new Error(`Failed to fetch media: ${error.message}`);
    }
  }

  /**
   * Create a scheduled message
   */
  async scheduleMessage(
    profileIds: string[],
    message: HootsuiteMessage,
    scheduledSendTime: Date
  ): Promise<HootsuiteScheduledMessage> {
    try {
      const requestData = {
        socialProfileIds: profileIds,
        scheduledSendTime: scheduledSendTime.toISOString(),
        ...message,
      };

      const response = await this.client.post('/messages', requestData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error scheduling message:', error);
      throw new Error(`Failed to schedule message: ${error.message}`);
    }
  }

  /**
   * Send a message immediately
   */
  async sendMessageNow(
    profileIds: string[],
    message: HootsuiteMessage
  ): Promise<HootsuiteScheduledMessage> {
    try {
      const now = new Date();
      return await this.scheduleMessage(profileIds, message, now);
    } catch (error: any) {
      console.error('Error sending message now:', error);
      throw new Error(`Failed to send message now: ${error.message}`);
    }
  }

  /**
   * Get scheduled messages
   */
  async getScheduledMessages(options: {
    state?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';
    limit?: number;
    offset?: number;
    startTime?: Date;
    endTime?: Date;
  } = {}): Promise<HootsuiteScheduledMessage[]> {
    try {
      const params: any = {
        limit: options.limit || 50,
        offset: options.offset || 0,
      };

      if (options.state) {
        params.state = options.state;
      }

      if (options.startTime) {
        params.startTime = options.startTime.toISOString();
      }

      if (options.endTime) {
        params.endTime = options.endTime.toISOString();
      }

      const response = await this.client.get('/messages', { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching scheduled messages:', error);
      throw new Error(`Failed to fetch scheduled messages: ${error.message}`);
    }
  }

  /**
   * Get specific message
   */
  async getMessage(messageId: string): Promise<HootsuiteScheduledMessage> {
    try {
      const response = await this.client.get(`/messages/${messageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching message:', error);
      throw new Error(`Failed to fetch message: ${error.message}`);
    }
  }

  /**
   * Update a scheduled message
   */
  async updateMessage(
    messageId: string,
    updates: {
      text?: string;
      scheduledSendTime?: Date;
      socialProfileIds?: string[];
    }
  ): Promise<HootsuiteScheduledMessage> {
    try {
      const requestData: any = {};

      if (updates.text) {
        requestData.text = updates.text;
      }

      if (updates.scheduledSendTime) {
        requestData.scheduledSendTime = updates.scheduledSendTime.toISOString();
      }

      if (updates.socialProfileIds) {
        requestData.socialProfileIds = updates.socialProfileIds;
      }

      const response = await this.client.put(`/messages/${messageId}`, requestData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating message:', error);
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  /**
   * Cancel a scheduled message
   */
  async cancelMessage(messageId: string): Promise<boolean> {
    try {
      await this.client.delete(`/messages/${messageId}`);
      return true;
    } catch (error: any) {
      console.error('Error cancelling message:', error);
      throw new Error(`Failed to cancel message: ${error.message}`);
    }
  }

  /**
   * Get analytics for social profiles
   */
  async getAnalytics(
    profileIds: string[],
    startTime: Date,
    endTime: Date,
    metrics?: string[]
  ): Promise<HootsuiteAnalytics> {
    try {
      const requestData = {
        socialProfileIds: profileIds,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        metrics: metrics || [
          'IMPRESSIONS',
          'REACH',
          'ENGAGEMENT',
          'CLICKS',
          'LIKES',
          'COMMENTS',
          'SHARES',
          'FOLLOWER_GROWTH',
        ],
      };

      const response = await this.client.post('/analytics', requestData);
      const analytics = response.data.data;

      // Transform analytics data
      return {
        impressions: this.getMetricValue(analytics, 'IMPRESSIONS'),
        reach: this.getMetricValue(analytics, 'REACH'),
        engagement: this.getMetricValue(analytics, 'ENGAGEMENT'),
        clicks: this.getMetricValue(analytics, 'CLICKS'),
        likes: this.getMetricValue(analytics, 'LIKES'),
        comments: this.getMetricValue(analytics, 'COMMENTS'),
        shares: this.getMetricValue(analytics, 'SHARES'),
        followerGrowth: this.getMetricValue(analytics, 'FOLLOWER_GROWTH'),
      };
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      // Return zero analytics if collection fails
      return this.getZeroAnalytics();
    }
  }

  /**
   * Get message analytics
   */
  async getMessageAnalytics(messageId: string): Promise<HootsuiteAnalytics> {
    try {
      const response = await this.client.get(`/messages/${messageId}/analytics`);
      const analytics = response.data.data;

      return {
        impressions: analytics.impressions || 0,
        reach: analytics.reach || 0,
        engagement: analytics.engagement || 0,
        clicks: analytics.clicks || 0,
        likes: analytics.likes || 0,
        comments: analytics.comments || 0,
        shares: analytics.shares || 0,
      };
    } catch (error: any) {
      console.error('Error fetching message analytics:', error);
      return this.getZeroAnalytics();
    }
  }

  /**
   * Get organization information
   */
  async getOrganizations(): Promise<any[]> {
    try {
      const response = await this.client.get('/organizations');
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }
  }

  /**
   * Get OAuth authorization URL
   */
  static generateAuthUrl(state: string): string {
    const scopes = [
      'offline',
      'read_social_profiles',
      'write_messages',
      'read_messages',
      'read_analytics',
    ];

    const params = new URLSearchParams({
      client_id: config.social.hootsuite.clientId,
      redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/hootsuite/callback`,
      scope: scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `https://platform.hootsuite.com/oauth2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post('https://platform.hootsuite.com/oauth2/token', {
        grant_type: 'authorization_code',
        code,
        client_id: config.social.hootsuite.clientId,
        client_secret: config.social.hootsuite.clientSecret,
        redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/hootsuite/callback`,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type || 'Bearer',
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post('https://platform.hootsuite.com/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.social.hootsuite.clientId,
        client_secret: config.social.hootsuite.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Some APIs don't return new refresh token
        tokenType: response.data.token_type || 'Bearer',
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get MIME type for media type
   */
  private getMimeType(mediaType: 'photo' | 'video' | 'gif'): string {
    switch (mediaType) {
      case 'photo':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Extract metric value from analytics response
   */
  private getMetricValue(analytics: any, metricName: string): number {
    if (!analytics || !Array.isArray(analytics)) {
      return 0;
    }

    const metric = analytics.find((m: any) => m.metric === metricName);
    return metric ? (metric.value || 0) : 0;
  }

  /**
   * Get zero analytics for fallback
   */
  private getZeroAnalytics(): HootsuiteAnalytics {
    return {
      impressions: 0,
      reach: 0,
      engagement: 0,
      clicks: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followerGrowth: 0,
    };
  }
}
