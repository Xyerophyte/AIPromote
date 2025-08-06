import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config';
import { decrypt } from '../utils/encryption';

export interface LinkedInCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface LinkedInPostData {
  text: string;
  mediaUrns?: string[];
  articleUrl?: string;
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN_USERS';
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  headline?: string;
  vanityName?: string;
}

export interface LinkedInAnalytics {
  impressions: number;
  clicks: number;
  reactions: number;
  comments: number;
  shares: number;
  engagement: number;
  reach: number;
}

export interface LinkedInPostResponse {
  id: string;
  urn: string;
  author: string;
  created: {
    time: number;
  };
}

export class LinkedInService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(credentials: LinkedInCredentials) {
    this.accessToken = credentials.accessToken;
    
    this.client = axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('LinkedIn API Error:', error.response?.data || error.message);
        throw new Error(`LinkedIn API Error: ${error.response?.data?.message || error.message}`);
      }
    );
  }

  /**
   * Create a new LinkedIn client with decrypted credentials
   */
  static async createWithEncryptedCredentials(
    encryptedAccessToken: string,
    encryptedRefreshToken?: string,
    expiresAt?: Date
  ): Promise<LinkedInService> {
    const credentials: LinkedInCredentials = {
      accessToken: decrypt(encryptedAccessToken),
      refreshToken: encryptedRefreshToken ? decrypt(encryptedRefreshToken) : undefined,
      expiresAt,
    };
    
    return new LinkedInService(credentials);
  }

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<LinkedInProfile> {
    try {
      const response = await this.client.get('/people/~', {
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,vanityName)',
        },
      });

      const profile = response.data;
      
      return {
        id: profile.id,
        firstName: profile.firstName.localized.en_US,
        lastName: profile.lastName.localized.en_US,
        headline: profile.headline?.localized?.en_US,
        vanityName: profile.vanityName,
        profilePicture: profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
      };
    } catch (error: any) {
      console.error('Error fetching LinkedIn profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  /**
   * Post content to LinkedIn
   */
  async postContent(postData: LinkedInPostData): Promise<LinkedInPostResponse> {
    try {
      // First get the user's profile to get person URN
      const profile = await this.getProfile();
      const authorUrn = `urn:li:person:${profile.id}`;

      const postBody = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postData.text,
            },
            shareMediaCategory: postData.mediaUrns ? 'IMAGE' : (postData.articleUrl ? 'ARTICLE' : 'NONE'),
            ...(postData.mediaUrns && {
              media: postData.mediaUrns.map(urn => ({
                status: 'READY',
                description: {
                  text: '',
                },
                media: urn,
                title: {
                  text: '',
                },
              })),
            }),
            ...(postData.articleUrl && {
              media: [{
                status: 'READY',
                description: {
                  text: postData.text,
                },
                originalUrl: postData.articleUrl,
              }],
            }),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': postData.visibility,
        },
      };

      const response = await this.client.post('/ugcPosts', postBody);

      return {
        id: response.data.id,
        urn: response.headers['x-linkedin-id'] || response.data.id,
        author: authorUrn,
        created: response.data.created,
      };
    } catch (error: any) {
      console.error('Error posting to LinkedIn:', error);
      throw new Error(`Failed to post content: ${error.message}`);
    }
  }

  /**
   * Delete a LinkedIn post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.client.delete(`/ugcPosts/${encodeURIComponent(postId)}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting LinkedIn post:', error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Get analytics for a specific post
   */
  async getPostAnalytics(postUrn: string): Promise<LinkedInAnalytics> {
    try {
      // LinkedIn analytics require specific permissions and endpoints
      const response = await this.client.get('/organizationalEntityShareStatistics', {
        params: {
          q: 'organizationalEntity',
          organizationalEntity: postUrn,
        },
      });

      const stats = response.data.elements?.[0]?.totalShareStatistics;

      return {
        impressions: stats?.impressionCount || 0,
        clicks: stats?.clickCount || 0,
        reactions: stats?.likeCount || 0,
        comments: stats?.commentCount || 0,
        shares: stats?.shareCount || 0,
        engagement: stats?.engagementCount || 0,
        reach: stats?.uniqueImpressionsCount || 0,
      };
    } catch (error: any) {
      console.error('Error fetching post analytics:', error);
      // Return zero analytics if access is not available
      return {
        impressions: 0,
        clicks: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        engagement: 0,
        reach: 0,
      };
    }
  }

  /**
   * Upload media to LinkedIn
   */
  async uploadMedia(mediaBuffer: Buffer, fileName: string): Promise<string> {
    try {
      // Step 1: Register upload
      const profile = await this.getProfile();
      const authorUrn = `urn:li:person:${profile.id}`;

      const registerResponse = await this.client.post('/assets?action=registerUpload', {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          }],
        },
      });

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload binary data
      await axios.put(uploadUrl, mediaBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      return asset;
    } catch (error: any) {
      console.error('Error uploading media to LinkedIn:', error);
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Get user's posts
   */
  async getUserPosts(count: number = 20): Promise<any[]> {
    try {
      const profile = await this.getProfile();
      const authorUrn = `urn:li:person:${profile.id}`;

      const response = await this.client.get('/ugcPosts', {
        params: {
          q: 'authors',
          authors: authorUrn,
          count,
        },
      });

      return response.data.elements || [];
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      throw new Error(`Failed to fetch user posts: ${error.message}`);
    }
  }

  /**
   * Get OAuth 2.0 authorization URL
   */
  static generateAuthUrl(state: string): string {
    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'r_member_social',
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.social.linkedin.clientId,
      redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/linkedin/callback`,
      state,
      scope: scopes.join(' '),
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<{
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
  }> {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        client_id: config.social.linkedin.clientId,
        client_secret: config.social.linkedin.clientSecret,
        redirect_uri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/linkedin/callback`,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        refreshToken: response.data.refresh_token,
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh access token (LinkedIn doesn't support refresh tokens by default)
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
  }> {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.social.linkedin.clientId,
        client_secret: config.social.linkedin.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        refreshToken: response.data.refresh_token,
      };
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error.response?.data?.error_description || error.message}`);
    }
  }
}
