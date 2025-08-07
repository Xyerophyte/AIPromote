import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { decrypt } from '../utils/encryption';

export interface FacebookCredentials {
  accessToken: string;
  pageId?: string;
  instagramAccountId?: string;
  expiresAt?: Date;
}

export interface FacebookPostData {
  message?: string;
  photoUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  caption?: string;
  published?: boolean;
  scheduledPublishTime?: number;
}

export interface InstagramPostData {
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  children?: string[]; // For carousel posts
}

export interface FacebookAnalytics {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reactions: {
    like: number;
    love: number;
    wow: number;
    haha: number;
    sad: number;
    angry: number;
  };
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  accessToken: string;
  instagramBusinessAccount?: {
    id: string;
    name: string;
  };
}

export class FacebookService {
  private client: AxiosInstance;
  private accessToken: string;
  private pageId?: string;
  private instagramAccountId?: string;

  constructor(credentials: FacebookCredentials) {
    this.accessToken = credentials.accessToken;
    this.pageId = credentials.pageId;
    this.instagramAccountId = credentials.instagramAccountId;
    
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Facebook API Error:', error.response?.data || error.message);
        throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
      }
    );
  }

  /**
   * Create a new Facebook client with decrypted credentials
   */
  static async createWithEncryptedCredentials(
    encryptedAccessToken: string,
    pageId?: string,
    instagramAccountId?: string,
    expiresAt?: Date
  ): Promise<FacebookService> {
    const credentials: FacebookCredentials = {
      accessToken: decrypt(encryptedAccessToken),
      pageId,
      instagramAccountId,
      expiresAt,
    };
    
    return new FacebookService(credentials);
  }

  /**
   * Get user's Facebook pages
   */
  async getUserPages(): Promise<FacebookPage[]> {
    try {
      const response = await this.client.get('/me/accounts', {
        params: {
          fields: 'id,name,category,access_token,instagram_business_account{id,name}',
        },
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        accessToken: page.access_token,
        instagramBusinessAccount: page.instagram_business_account,
      }));
    } catch (error: any) {
      console.error('Error fetching user pages:', error);
      throw new Error(`Failed to fetch user pages: ${error.message}`);
    }
  }

  /**
   * Post content to Facebook page
   */
  async postToFacebook(postData: FacebookPostData): Promise<{ id: string; postId: string }> {
    try {
      if (!this.pageId) {
        throw new Error('Page ID is required for Facebook posting');
      }

      const requestData: any = {};

      if (postData.message) {
        requestData.message = postData.message;
      }

      if (postData.linkUrl) {
        requestData.link = postData.linkUrl;
      }

      if (postData.photoUrl) {
        requestData.url = postData.photoUrl;
      }

      if (postData.videoUrl) {
        requestData.source = postData.videoUrl;
      }

      if (postData.scheduledPublishTime) {
        requestData.scheduled_publish_time = postData.scheduledPublishTime;
        requestData.published = false;
      } else {
        requestData.published = postData.published !== false;
      }

      // Choose endpoint based on content type
      let endpoint = `/${this.pageId}/feed`;
      if (postData.photoUrl) {
        endpoint = `/${this.pageId}/photos`;
      } else if (postData.videoUrl) {
        endpoint = `/${this.pageId}/videos`;
      }

      const response = await this.client.post(endpoint, requestData);

      return {
        id: response.data.id,
        postId: response.data.post_id || response.data.id,
      };
    } catch (error: any) {
      console.error('Error posting to Facebook:', error);
      throw new Error(`Failed to post to Facebook: ${error.message}`);
    }
  }

  /**
   * Post content to Instagram
   */
  async postToInstagram(postData: InstagramPostData): Promise<{ id: string }> {
    try {
      if (!this.instagramAccountId) {
        throw new Error('Instagram account ID is required for Instagram posting');
      }

      // Step 1: Create media container
      const mediaData: any = {
        caption: postData.caption,
        media_type: postData.mediaType,
      };

      if (postData.imageUrl) {
        mediaData.image_url = postData.imageUrl;
      }

      if (postData.videoUrl) {
        mediaData.video_url = postData.videoUrl;
      }

      if (postData.children && postData.mediaType === 'CAROUSEL_ALBUM') {
        mediaData.children = postData.children;
      }

      const containerResponse = await this.client.post(
        `/${this.instagramAccountId}/media`,
        mediaData
      );

      const creationId = containerResponse.data.id;

      // Step 2: Publish the media container
      const publishResponse = await this.client.post(
        `/${this.instagramAccountId}/media_publish`,
        {
          creation_id: creationId,
        }
      );

      return {
        id: publishResponse.data.id,
      };
    } catch (error: any) {
      console.error('Error posting to Instagram:', error);
      throw new Error(`Failed to post to Instagram: ${error.message}`);
    }
  }

  /**
   * Upload media for Instagram carousel
   */
  async uploadInstagramMedia(mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO'): Promise<string> {
    try {
      if (!this.instagramAccountId) {
        throw new Error('Instagram account ID is required');
      }

      const mediaData: any = {
        media_type: mediaType,
        is_carousel_item: true,
      };

      if (mediaType === 'IMAGE') {
        mediaData.image_url = mediaUrl;
      } else {
        mediaData.video_url = mediaUrl;
      }

      const response = await this.client.post(
        `/${this.instagramAccountId}/media`,
        mediaData
      );

      return response.data.id;
    } catch (error: any) {
      console.error('Error uploading Instagram media:', error);
      throw new Error(`Failed to upload Instagram media: ${error.message}`);
    }
  }

  /**
   * Get Facebook post analytics
   */
  async getFacebookPostAnalytics(postId: string): Promise<FacebookAnalytics> {
    try {
      const response = await this.client.get(`/${postId}/insights`, {
        params: {
          metric: [
            'post_impressions',
            'post_impressions_unique',
            'post_engaged_users',
            'post_clicks',
            'post_reactions_like_total',
            'post_reactions_love_total',
            'post_reactions_wow_total',
            'post_reactions_haha_total',
            'post_reactions_sad_total',
            'post_reactions_angry_total',
          ].join(','),
        },
      });

      const metrics = response.data.data;
      const getMetricValue = (name: string) => {
        const metric = metrics.find((m: any) => m.name === name);
        return metric ? (metric.values[0]?.value || 0) : 0;
      };

      // Get engagement metrics from post object
      const postResponse = await this.client.get(`/${postId}`, {
        params: {
          fields: 'likes.summary(true),comments.summary(true),shares',
        },
      });

      const post = postResponse.data;

      return {
        impressions: getMetricValue('post_impressions'),
        reach: getMetricValue('post_impressions_unique'),
        engagement: getMetricValue('post_engaged_users'),
        likes: post.likes?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
        clicks: getMetricValue('post_clicks'),
        reactions: {
          like: getMetricValue('post_reactions_like_total'),
          love: getMetricValue('post_reactions_love_total'),
          wow: getMetricValue('post_reactions_wow_total'),
          haha: getMetricValue('post_reactions_haha_total'),
          sad: getMetricValue('post_reactions_sad_total'),
          angry: getMetricValue('post_reactions_angry_total'),
        },
      };
    } catch (error: any) {
      console.error('Error fetching Facebook post analytics:', error);
      // Return zero analytics if collection fails
      return this.getZeroAnalytics();
    }
  }

  /**
   * Get Instagram post analytics
   */
  async getInstagramPostAnalytics(mediaId: string): Promise<FacebookAnalytics> {
    try {
      const response = await this.client.get(`/${mediaId}/insights`, {
        params: {
          metric: [
            'impressions',
            'reach',
            'engagement',
            'likes',
            'comments',
            'saves',
            'shares',
          ].join(','),
        },
      });

      const metrics = response.data.data;
      const getMetricValue = (name: string) => {
        const metric = metrics.find((m: any) => m.name === name);
        return metric ? (metric.values[0]?.value || 0) : 0;
      };

      return {
        impressions: getMetricValue('impressions'),
        reach: getMetricValue('reach'),
        engagement: getMetricValue('engagement'),
        likes: getMetricValue('likes'),
        comments: getMetricValue('comments'),
        shares: getMetricValue('shares'),
        clicks: 0, // Instagram doesn't provide click metrics for regular posts
        reactions: {
          like: getMetricValue('likes'),
          love: 0,
          wow: 0,
          haha: 0,
          sad: 0,
          angry: 0,
        },
      };
    } catch (error: any) {
      console.error('Error fetching Instagram post analytics:', error);
      // Return zero analytics if collection fails
      return this.getZeroAnalytics();
    }
  }

  /**
   * Delete Facebook post
   */
  async deleteFacebookPost(postId: string): Promise<boolean> {
    try {
      await this.client.delete(`/${postId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting Facebook post:', error);
      throw new Error(`Failed to delete Facebook post: ${error.message}`);
    }
  }

  /**
   * Delete Instagram post
   */
  async deleteInstagramPost(mediaId: string): Promise<boolean> {
    try {
      await this.client.delete(`/${mediaId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting Instagram post:', error);
      throw new Error(`Failed to delete Instagram post: ${error.message}`);
    }
  }

  /**
   * Get OAuth authorization URL
   */
  static generateAuthUrl(state: string): string {
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'instagram_basic',
      'instagram_content_publish',
      'business_management',
    ];

    const params = new URLSearchParams({
      client_id: config.social.facebook.appId,
      redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/facebook/callback`,
      scope: scopes.join(','),
      response_type: 'code',
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
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
    expiresIn?: number;
  }> {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: config.social.facebook.appId,
          client_secret: config.social.facebook.appSecret,
          redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/facebook/callback`,
          code,
        },
      });

      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'bearer',
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Extend short-lived token to long-lived token
   */
  static async extendAccessToken(shortLivedToken: string): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.social.facebook.appId,
          client_secret: config.social.facebook.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return {
        accessToken: response.data.access_token,
        tokenType: 'bearer',
        expiresIn: response.data.expires_in || 5183944, // ~60 days default
      };
    } catch (error: any) {
      console.error('Error extending access token:', error);
      throw new Error(`Failed to extend access token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get zero analytics for fallback
   */
  private getZeroAnalytics(): FacebookAnalytics {
    return {
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      reactions: {
        like: 0,
        love: 0,
        wow: 0,
        haha: 0,
        sad: 0,
        angry: 0,
      },
    };
  }
}
