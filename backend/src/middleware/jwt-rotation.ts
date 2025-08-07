import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { redis } from '../config/redis';
import crypto from 'crypto';

/**
 * JWT Token Rotation and Refresh Token Management
 */

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenData {
  userId: string;
  organizationId?: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  rotationCount: number;
  device?: string;
  ipAddress?: string;
}

interface AccessTokenPayload {
  userId: string;
  organizationId?: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
  tokenVersion: number;
}

export class JWTTokenManager {
  private readonly accessTokenTTL = 60 * 60; // 1 hour in seconds
  private readonly refreshTokenTTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly rotationThreshold = 15 * 60; // 15 minutes in seconds
  private readonly maxRotationCount = 10; // Max rotations before forcing re-login

  /**
   * Generate a new token pair (access + refresh tokens)
   */
  async generateTokenPair(payload: {
    userId: string;
    organizationId?: string;
    email: string;
    role: string;
    device?: string;
    ipAddress?: string;
  }): Promise<TokenPair> {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);

    // Create access token
    const accessTokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      email: payload.email,
      role: payload.role,
      sessionId,
      tokenVersion: 1,
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'aipromotapp',
      audience: 'aipromotapp-users',
    });

    // Create refresh token data
    const refreshTokenData: RefreshTokenData = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      sessionId,
      issuedAt: now,
      expiresAt: now + this.refreshTokenTTL,
      rotationCount: 0,
      device: payload.device,
      ipAddress: payload.ipAddress,
    };

    // Generate secure refresh token
    const refreshToken = this.generateSecureRefreshToken(refreshTokenData);

    // Store refresh token in Redis with expiration
    const refreshTokenKey = `refresh_token:${sessionId}`;
    await redis.setex(
      refreshTokenKey,
      this.refreshTokenTTL,
      JSON.stringify(refreshTokenData)
    );

    // Track active sessions for user
    await this.trackUserSession(payload.userId, sessionId);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh an access token using a valid refresh token
   */
  async refreshAccessToken(refreshToken: string, ipAddress?: string): Promise<TokenPair | null> {
    try {
      // Decode refresh token
      const refreshTokenData = this.decodeRefreshToken(refreshToken);
      if (!refreshTokenData) {
        return null;
      }

      // Verify refresh token exists in Redis
      const refreshTokenKey = `refresh_token:${refreshTokenData.sessionId}`;
      const storedTokenData = await redis.get(refreshTokenKey);
      
      if (!storedTokenData) {
        // Token not found or expired
        return null;
      }

      const storedData: RefreshTokenData = JSON.parse(storedTokenData);
      
      // Verify token integrity
      if (!this.verifyRefreshTokenIntegrity(refreshTokenData, storedData)) {
        // Delete compromised token
        await redis.del(refreshTokenKey);
        await this.revokeUserSession(storedData.userId, storedData.sessionId);
        return null;
      }

      // Check if token needs rotation (close to expiry or threshold reached)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = storedData.expiresAt - now;
      const shouldRotate = timeUntilExpiry < this.rotationThreshold || 
                          storedData.rotationCount >= this.maxRotationCount;

      if (shouldRotate) {
        // Generate new token pair
        // First, get user details for new token
        const userDetails = await this.getUserDetailsForToken(storedData.userId);
        if (!userDetails) {
          return null;
        }

        // Create new token pair
        const newTokenPair = await this.generateTokenPair({
          ...userDetails,
          device: storedData.device,
          ipAddress: ipAddress || storedData.ipAddress,
        });

        // Revoke old session
        await redis.del(refreshTokenKey);
        await this.revokeUserSession(storedData.userId, storedData.sessionId);

        return newTokenPair;
      } else {
        // Just generate new access token with incremented version
        const userDetails = await this.getUserDetailsForToken(storedData.userId);
        if (!userDetails) {
          return null;
        }

        const accessTokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
          userId: storedData.userId,
          organizationId: storedData.organizationId,
          email: userDetails.email,
          role: userDetails.role,
          sessionId: storedData.sessionId,
          tokenVersion: storedData.rotationCount + 1,
        };

        const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, {
          expiresIn: config.jwt.expiresIn,
          issuer: 'aipromotapp',
          audience: 'aipromotapp-users',
        });

        // Update rotation count
        storedData.rotationCount += 1;
        await redis.setex(
          refreshTokenKey,
          timeUntilExpiry,
          JSON.stringify(storedData)
        );

        return { accessToken, refreshToken }; // Same refresh token
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Revoke a refresh token and associated session
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const refreshTokenData = this.decodeRefreshToken(refreshToken);
      if (!refreshTokenData) {
        return false;
      }

      const refreshTokenKey = `refresh_token:${refreshTokenData.sessionId}`;
      await redis.del(refreshTokenKey);
      await this.revokeUserSession(refreshTokenData.userId, refreshTokenData.sessionId);

      return true;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
  }

  /**
   * Revoke all sessions for a user (force logout from all devices)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessionsKey = `user_sessions:${userId}`;
    const sessions = await redis.smembers(sessionsKey);

    for (const sessionId of sessions) {
      const refreshTokenKey = `refresh_token:${sessionId}`;
      await redis.del(refreshTokenKey);
    }

    await redis.del(sessionsKey);
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<RefreshTokenData[]> {
    const sessionsKey = `user_sessions:${userId}`;
    const sessionIds = await redis.smembers(sessionsKey);

    const sessions: RefreshTokenData[] = [];
    for (const sessionId of sessionIds) {
      const refreshTokenKey = `refresh_token:${sessionId}`;
      const tokenData = await redis.get(refreshTokenKey);
      
      if (tokenData) {
        sessions.push(JSON.parse(tokenData));
      }
    }

    return sessions;
  }

  /**
   * Verify if an access token is valid and not revoked
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: 'aipromotapp',
        audience: 'aipromotapp-users',
      }) as AccessTokenPayload;

      // Check if session is still active
      const refreshTokenKey = `refresh_token:${payload.sessionId}`;
      const sessionExists = await redis.exists(refreshTokenKey);

      if (!sessionExists) {
        // Session has been revoked
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Middleware for token rotation
   */
  createRotationMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.verifyAccessToken(token);
      
      if (!payload) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }

      // Check if token is close to expiry (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      if (timeUntilExpiry < 300) { // 5 minutes
        // Send header indicating token should be refreshed
        reply.header('X-Token-Refresh-Required', 'true');
      }

      // Attach user info to request
      (request as any).user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
        sessionId: payload.sessionId,
      };
    };
  }

  /**
   * Middleware for refresh token validation
   */
  createRefreshMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const { refreshToken } = request.body as { refreshToken: string };
      
      if (!refreshToken) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Refresh token is required',
        });
        return;
      }

      const tokenPair = await this.refreshAccessToken(refreshToken, request.ip);
      
      if (!tokenPair) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
        return;
      }

      reply.send({
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      });
    };
  }

  // Private helper methods
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateSecureRefreshToken(data: RefreshTokenData): string {
    const payload = Buffer.from(JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      issuedAt: data.issuedAt,
    })).toString('base64');

    const signature = crypto
      .createHmac('sha256', config.jwt.secret)
      .update(payload)
      .digest('hex');

    return `${payload}.${signature}`;
  }

  private decodeRefreshToken(token: string): RefreshTokenData | null {
    try {
      const [payload, signature] = token.split('.');
      
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', config.jwt.secret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return null;
      }

      const data = JSON.parse(Buffer.from(payload, 'base64').toString());
      return data;
    } catch {
      return null;
    }
  }

  private verifyRefreshTokenIntegrity(
    tokenData: RefreshTokenData, 
    storedData: RefreshTokenData
  ): boolean {
    return (
      tokenData.sessionId === storedData.sessionId &&
      tokenData.userId === storedData.userId &&
      tokenData.issuedAt === storedData.issuedAt
    );
  }

  private async trackUserSession(userId: string, sessionId: string): Promise<void> {
    const sessionsKey = `user_sessions:${userId}`;
    await redis.sadd(sessionsKey, sessionId);
    await redis.expire(sessionsKey, this.refreshTokenTTL);
  }

  private async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    const sessionsKey = `user_sessions:${userId}`;
    await redis.srem(sessionsKey, sessionId);
  }

  private async getUserDetailsForToken(userId: string): Promise<{
    email: string;
    role: string;
    organizationId?: string;
  } | null> {
    // This would typically query your database
    // For now, returning a mock implementation
    // You should replace this with actual user lookup
    try {
      // const user = await prisma.user.findUnique({ where: { id: userId } });
      // return user ? { email: user.email, role: user.role, organizationId: user.organizationId } : null;
      
      // Mock implementation - replace with actual database query
      return {
        email: 'user@example.com',
        role: 'USER',
        organizationId: undefined,
      };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const jwtTokenManager = new JWTTokenManager();

// Utility function to sanitize object for logging
function sanitizeObject(obj: any): any {
  const sanitized = { ...obj };
  const keysToRemove = ['password', 'token', 'secret', 'key'];
  
  Object.keys(sanitized).forEach(key => {
    if (keysToRemove.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
