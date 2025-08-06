import { TwitterApi, TweetV2PostTweetResult, TweetV2, UserV2 } from 'twitter-api-v2';
import { config } from '../config/config';
import { decrypt } from '../utils/encryption';

export interface TwitterCredentials {
  accessToken: string;
  refreshToken?: string;
  tokenSecret?: string; // For OAuth 1.0a
}

export interface TwitterPostData {
  text: string;
  mediaIds?: string[];
  quoteTweetId?: string;
  replyToTweetId?: string;
  poll?: {
    options: string[];
    durationMinutes: number;
  };
}

export interface TwitterAnalytics {
  impressions: number;
  publicMetrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
    bookmarkCount?: number;
  };
  organicMetrics?: {
    impressionCount: number;
    likeCount: number;
    replyCount: number;
    retweetCount: number;
  };
  nonPublicMetrics?: {
    impressionCount: number;
    urlLinkClicks: number;
    userProfileClicks: number;
  };
}

export class TwitterService {
  private client: TwitterApi;
  
  constructor(credentials?: TwitterCredentials) {
    if (credentials) {
      // User-specific client with OAuth tokens
      this.client = new TwitterApi({
        appKey: config.social.twitter.apiKey,
        appSecret: config.social.twitter.apiSecret,
        accessToken: credentials.accessToken,
        accessSecret: credentials.tokenSecret || '',
      });
    } else {
      // App-only client for general API access
      this.client = new TwitterApi(config.social.twitter.bearerToken);
    }
  }

  /**
   * Create a new Twitter client with decrypted credentials
   */
  static async createWithEncryptedCredentials(
    encryptedAccessToken: string,
    encryptedTokenSecret?: string,
    encryptedRefreshToken?: string
  ): Promise<TwitterService> {
    const credentials: TwitterCredentials = {
      accessToken: decrypt(encryptedAccessToken),
      refreshToken: encryptedRefreshToken ? decrypt(encryptedRefreshToken) : undefined,
      tokenSecret: encryptedTokenSecret ? decrypt(encryptedTokenSecret) : undefined,
    };
    
    return new TwitterService(credentials);
  }

  /**
   * Post a tweet
   */
  async postTweet(postData: TwitterPostData): Promise<TweetV2PostTweetResult> {
    try {
      const tweetData: any = {
        text: postData.text,
      };

      // Add media if provided
      if (postData.mediaIds && postData.mediaIds.length > 0) {
        tweetData.media = {
          media_ids: postData.mediaIds,
        };
      }

      // Add quote tweet if provided
      if (postData.quoteTweetId) {
        tweetData.quote_tweet_id = postData.quoteTweetId;
      }

      // Add reply if provided
      if (postData.replyToTweetId) {
        tweetData.reply = {
          in_reply_to_tweet_id: postData.replyToTweetId,
        };
      }

      // Add poll if provided
      if (postData.poll) {
        tweetData.poll = {
          options: postData.poll.options,
          duration_minutes: postData.poll.durationMinutes,
        };
      }

      const result = await this.client.v2.tweet(tweetData);
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Twitter API errors: ${result.errors.map(e => e.detail).join(', ')}`);
      }

      return result;
    } catch (error: any) {
      console.error('Error posting tweet:', error);
      throw new Error(`Failed to post tweet: ${error.message}`);
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<boolean> {
    try {
      const result = await this.client.v2.deleteTweet(tweetId);
      return result.data.deleted;
    } catch (error: any) {
      console.error('Error deleting tweet:', error);
      throw new Error(`Failed to delete tweet: ${error.message}`);
    }
  }

  /**
   * Get tweet analytics
   */
  async getTweetAnalytics(tweetId: string): Promise<TwitterAnalytics> {
    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': [
          'public_metrics',
          'organic_metrics',
          'non_public_metrics',
          'promoted_metrics',
          'created_at',
          'author_id',
        ],
      });

      if (!tweet.data) {
        throw new Error('Tweet not found');
      }

      // Note: organic_metrics and non_public_metrics require special permissions
      return {
        impressions: tweet.data.non_public_metrics?.impression_count || 0,
        publicMetrics: {
          retweetCount: tweet.data.public_metrics?.retweet_count || 0,
          likeCount: tweet.data.public_metrics?.like_count || 0,
          replyCount: tweet.data.public_metrics?.reply_count || 0,
          quoteCount: tweet.data.public_metrics?.quote_count || 0,
          bookmarkCount: tweet.data.public_metrics?.bookmark_count || 0,
        },
        organicMetrics: tweet.data.organic_metrics ? {
          impressionCount: tweet.data.organic_metrics.impression_count || 0,
          likeCount: tweet.data.organic_metrics.like_count || 0,
          replyCount: tweet.data.organic_metrics.reply_count || 0,
          retweetCount: tweet.data.organic_metrics.retweet_count || 0,
        } : undefined,
        nonPublicMetrics: tweet.data.non_public_metrics ? {
          impressionCount: tweet.data.non_public_metrics.impression_count || 0,
          urlLinkClicks: tweet.data.non_public_metrics.url_link_clicks || 0,
          userProfileClicks: tweet.data.non_public_metrics.user_profile_clicks || 0,
        } : undefined,
      };
    } catch (error: any) {
      console.error('Error fetching tweet analytics:', error);
      throw new Error(`Failed to fetch tweet analytics: ${error.message}`);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId?: string): Promise<UserV2> {
    try {
      const result = userId 
        ? await this.client.v2.user(userId, {
            'user.fields': ['public_metrics', 'created_at', 'description', 'location', 'verified'],
          })
        : await this.client.v2.me({
            'user.fields': ['public_metrics', 'created_at', 'description', 'location', 'verified'],
          });

      if (!result.data) {
        throw new Error('User not found');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  /**
   * Upload media for tweets
   */
  async uploadMedia(mediaBuffer: Buffer, mediaType: string): Promise<string> {
    try {
      const mediaId = await this.client.v1.uploadMedia(mediaBuffer, { 
        mimeType: mediaType,
      });
      
      return mediaId;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Get user's recent tweets with analytics
   */
  async getUserTweets(
    userId: string,
    options: {
      maxResults?: number;
      sinceId?: string;
      untilId?: string;
    } = {}
  ): Promise<TweetV2[]> {
    try {
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: options.maxResults || 10,
        since_id: options.sinceId,
        until_id: options.untilId,
        'tweet.fields': [
          'public_metrics',
          'created_at',
          'context_annotations',
          'entities',
          'referenced_tweets',
        ],
        'user.fields': ['username', 'name'],
        expansions: ['author_id', 'referenced_tweets.id'],
      });

      return tweets.data.data || [];
    } catch (error: any) {
      console.error('Error fetching user tweets:', error);
      throw new Error(`Failed to fetch user tweets: ${error.message}`);
    }
  }

  /**
   * Search for tweets
   */
  async searchTweets(query: string, maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const tweets = await this.client.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': [
          'public_metrics',
          'created_at',
          'context_annotations',
          'entities',
        ],
        'user.fields': ['username', 'name', 'verified'],
        expansions: ['author_id'],
      });

      return tweets.data.data || [];
    } catch (error: any) {
      console.error('Error searching tweets:', error);
      throw new Error(`Failed to search tweets: ${error.message}`);
    }
  }

  /**
   * Get OAuth 2.0 authorization URL
   */
  static generateAuthUrl(): { url: string; state: string; codeVerifier: string } {
    const client = new TwitterApi({
      clientId: config.social.twitter.clientId,
      clientSecret: config.social.twitter.clientSecret,
    });

    const { url, state, codeVerifier } = client.generateOAuth2AuthLink(
      `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/twitter/callback`,
      {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      }
    );

    return { url, state, codeVerifier };
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const client = new TwitterApi({
        clientId: config.social.twitter.clientId,
        clientSecret: config.social.twitter.clientSecret,
      });

      const result = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/social/twitter/callback`,
      });

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const client = new TwitterApi({
        clientId: config.social.twitter.clientId,
        clientSecret: config.social.twitter.clientSecret,
      });

      const result = await client.refreshOAuth2Token(refreshToken);

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }
}
