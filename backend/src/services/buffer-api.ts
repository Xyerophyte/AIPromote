import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { decrypt } from '../utils/encryption';

export interface BufferCredentials {
  accessToken: string;
}

export interface BufferProfile {
  id: string;
  avatar: string;
  createdAt: number;
  defaultText: string;
  formattedUsername: string;
  service: string;
  serviceId: string;
  serviceUsername: string;
  timezone: string;
  userId: string;
}

export interface BufferPostData {
  text: string;
  profileIds: string[];
  media?: {
    link?: string;
    description?: string;
    title?: string;
    picture?: string;
    photo?: string;
    thumbnail?: string;
  };
  scheduledAt?: Date;
  now?: boolean;
  top?: boolean;
  shorten?: boolean;
}

export interface BufferUpdate {
  id: string;
  createdAt: number;
  day: string;
  dueAt: number;
  dueTime: string;
  profileId: string;
  profileService: string;
  status: 'buffer' | 'sent' | 'failed';
  text: string;
  textFormatted: string;
  userId: string;
  via: string;
  serviceUpdateId?: string;
  media?: any;
  statistics?: {
    clicks: number;
    favorites: number;
    mentions: number;
    reach: number;
    retweets: number;
  };
}

export interface BufferAnalytics {
  clicks: number;
  favorites: number;
  mentions: number;
  reach: number;
  retweets: number;
  shares?: number;
  comments?: number;
  engagementRate?: number;
}

export class BufferService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(credentials: BufferCredentials) {
    this.accessToken = credentials.accessToken;
    
    this.client = axios.create({
      baseURL: 'https://api.bufferapp.com/1',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Buffer API Error:', error.response?.data || error.message);
        throw new Error(`Buffer API Error: ${error.response?.data?.error || error.message}`);
      }
    );
  }

  /**
   * Create a new Buffer client with decrypted credentials
   */
  static async createWithEncryptedCredentials(
    encryptedAccessToken: string
  ): Promise<BufferService> {
    const credentials: BufferCredentials = {
      accessToken: decrypt(encryptedAccessToken),
    };
    
    return new BufferService(credentials);
  }

  /**
   * Get current user info
   */
  async getUser(): Promise<any> {
    try {
      const response = await this.client.get('/user.json');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      throw new Error(`Failed to fetch user info: ${error.message}`);
    }
  }

  /**
   * Get user's social media profiles
   */
  async getProfiles(): Promise<BufferProfile[]> {
    try {
      const response = await this.client.get('/profiles.json');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
  }

  /**
   * Get specific profile information
   */
  async getProfile(profileId: string): Promise<BufferProfile> {
    try {
      const response = await this.client.get(`/profiles/${profileId}.json`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  /**
   * Create a new update (post)
   */
  async createUpdate(postData: BufferPostData): Promise<{ success: boolean; updates: BufferUpdate[] }> {
    try {
      const requestData: any = {
        text: postData.text,
        profile_ids: postData.profileIds,
        shorten: postData.shorten !== false,
      };

      if (postData.media) {
        if (postData.media.link) {
          requestData.media = {
            link: postData.media.link,
            description: postData.media.description,
            title: postData.media.title,
            picture: postData.media.picture,
          };
        }
        
        if (postData.media.photo) {
          requestData.media = {
            photo: postData.media.photo,
            thumbnail: postData.media.thumbnail,
          };
        }
      }

      if (postData.scheduledAt) {
        requestData.scheduled_at = Math.floor(postData.scheduledAt.getTime() / 1000);
      } else if (postData.now) {
        requestData.now = true;
      } else if (postData.top) {
        requestData.top = true;
      }

      const response = await this.client.post('/updates/create.json', requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating update:', error);
      throw new Error(`Failed to create update: ${error.message}`);
    }
  }

  /**
   * Get pending updates for a profile
   */
  async getPendingUpdates(profileId: string): Promise<BufferUpdate[]> {
    try {
      const response = await this.client.get(`/profiles/${profileId}/updates/pending.json`);
      return response.data.updates || [];
    } catch (error: any) {
      console.error('Error fetching pending updates:', error);
      throw new Error(`Failed to fetch pending updates: ${error.message}`);
    }
  }

  /**
   * Get sent updates for a profile
   */
  async getSentUpdates(profileId: string, options: {
    page?: number;
    count?: number;
    since?: Date;
    utc?: boolean;
  } = {}): Promise<BufferUpdate[]> {
    try {
      const params: any = {
        page: options.page || 1,
        count: options.count || 30,
        utc: options.utc !== false,
      };

      if (options.since) {
        params.since = Math.floor(options.since.getTime() / 1000);
      }

      const response = await this.client.get(`/profiles/${profileId}/updates/sent.json`, {
        params,
      });
      return response.data.updates || [];
    } catch (error: any) {
      console.error('Error fetching sent updates:', error);
      throw new Error(`Failed to fetch sent updates: ${error.message}`);
    }
  }

  /**
   * Get specific update
   */
  async getUpdate(updateId: string): Promise<BufferUpdate> {
    try {
      const response = await this.client.get(`/updates/${updateId}.json`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching update:', error);
      throw new Error(`Failed to fetch update: ${error.message}`);
    }
  }

  /**
   * Get update interactions (analytics)
   */
  async getUpdateInteractions(updateId: string): Promise<BufferAnalytics> {
    try {
      const response = await this.client.get(`/updates/${updateId}/interactions.json`);
      const interactions = response.data.interactions;

      return {
        clicks: interactions.clicks || 0,
        favorites: interactions.favorites || 0,
        mentions: interactions.mentions || 0,
        reach: interactions.reach || 0,
        retweets: interactions.retweets || 0,
        shares: interactions.shares || 0,
        comments: interactions.comments || 0,
        engagementRate: this.calculateEngagementRate(
          (interactions.favorites || 0) + (interactions.retweets || 0) + (interactions.comments || 0),
          interactions.reach || 0
        ),
      };
    } catch (error: any) {
      console.error('Error fetching update interactions:', error);
      // Return zero analytics if collection fails
      return this.getZeroAnalytics();
    }
  }

  /**
   * Edit an existing update
   */
  async updateUpdate(updateId: string, updateData: {
    text?: string;
    now?: boolean;
    utc?: boolean;
    media?: any;
  }): Promise<BufferUpdate> {
    try {
      const requestData: any = {
        utc: updateData.utc !== false,
      };

      if (updateData.text) {
        requestData.text = updateData.text;
      }

      if (updateData.now) {
        requestData.now = true;
      }

      if (updateData.media) {
        requestData.media = updateData.media;
      }

      const response = await this.client.post(`/updates/${updateId}/update.json`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating update:', error);
      throw new Error(`Failed to update update: ${error.message}`);
    }
  }

  /**
   * Delete/destroy an update
   */
  async deleteUpdate(updateId: string): Promise<boolean> {
    try {
      await this.client.post(`/updates/${updateId}/destroy.json`);
      return true;
    } catch (error: any) {
      console.error('Error deleting update:', error);
      throw new Error(`Failed to delete update: ${error.message}`);
    }
  }

  /**
   * Move an update to the top of the queue
   */
  async moveUpdateToTop(updateId: string): Promise<boolean> {
    try {
      await this.client.post(`/updates/${updateId}/move_to_top.json`);
      return true;
    } catch (error: any) {
      console.error('Error moving update to top:', error);
      throw new Error(`Failed to move update to top: ${error.message}`);
    }
  }

  /**
   * Share an update immediately
   */
  async shareUpdateNow(updateId: string): Promise<boolean> {
    try {
      await this.client.post(`/updates/${updateId}/share.json`);
      return true;
    } catch (error: any) {
      console.error('Error sharing update now:', error);
      throw new Error(`Failed to share update now: ${error.message}`);
    }
  }

  /**
   * Get posting schedules for a profile
   */
  async getProfileSchedules(profileId: string): Promise<any> {
    try {
      const response = await this.client.get(`/profiles/${profileId}/schedules.json`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile schedules:', error);
      throw new Error(`Failed to fetch profile schedules: ${error.message}`);
    }
  }

  /**
   * Update posting schedules for a profile
   */
  async updateProfileSchedules(profileId: string, schedules: any): Promise<boolean> {
    try {
      await this.client.post(`/profiles/${profileId}/schedules/update.json`, {
        schedules,
      });
      return true;
    } catch (error: any) {
      console.error('Error updating profile schedules:', error);
      throw new Error(`Failed to update profile schedules: ${error.message}`);
    }
  }

  /**
   * Get configuration information
   */
  async getConfiguration(): Promise<any> {
    try {
      const response = await this.client.get('/info/configuration.json');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching configuration:', error);
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }
  }

  /**
   * Get OAuth authorization URL
   */
  static generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.social.buffer.clientId,
      redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/buffer/callback`,
      response_type: 'code',
      state,
    });

    return `https://bufferapp.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<{
    accessToken: string;
    tokenType: string;
  }> {
    try {
      const response = await axios.post('https://api.bufferapp.com/1/oauth2/token.json', {
        client_id: config.social.buffer.clientId,
        client_secret: config.social.buffer.clientSecret,
        redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/buffer/callback`,
        code,
        grant_type: 'authorization_code',
      });

      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'bearer',
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(totalEngagements: number, reach: number): number {
    if (reach === 0) return 0;
    return (totalEngagements / reach) * 100;
  }

  /**
   * Get zero analytics for fallback
   */
  private getZeroAnalytics(): BufferAnalytics {
    return {
      clicks: 0,
      favorites: 0,
      mentions: 0,
      reach: 0,
      retweets: 0,
      shares: 0,
      comments: 0,
      engagementRate: 0,
    };
  }
}
