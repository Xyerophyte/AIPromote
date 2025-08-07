import { createMocks } from 'node-mocks-http';
import { POST as registerHandler } from '../auth/register/route';
import { POST as resetPasswordHandler } from '../auth/reset-password/route';
import { POST as forgotPasswordHandler } from '../auth/forgot-password/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    }),
  }),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock email service
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

describe('Auth API Integration Tests', () => {
  let mockSupabase: any;
  let mockRateLimit: any;
  let mockEmail: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase').createRouteHandlerClient();
    mockRateLimit = require('@/lib/rate-limit').rateLimiter;
    mockEmail = require('@/lib/email');
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      // Mock successful Supabase signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: userData.email,
            email_confirmed_at: null,
          },
        },
        error: null,
      });

      // Mock successful profile creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: [{ id: 'profile-123' }],
        error: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: userData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('registration successful');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            organization_name: userData.organizationName,
          },
        },
      });
      expect(mockEmail.sendVerificationEmail).toHaveBeenCalledWith(userData.email);
    });

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      // Mock Supabase error for duplicate email
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('User already registered');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing required fields
      };

      const { req } = createMocks({
        method: 'POST',
        body: incompleteData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('validation');
    });

    it('should enforce rate limiting', async () => {
      // Mock rate limit exceeded
      mockRateLimit.check.mockResolvedValueOnce({
        success: false,
        error: 'Too many requests',
      });

      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      const { req } = createMocks({
        method: 'POST',
        body: userData,
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toContain('Too many requests');
    });

    it('should validate email format', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('email');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123', // Too weak
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      const { req } = createMocks({
        method: 'POST',
        body: weakPasswordData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('password');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for valid user', async () => {
      const resetData = {
        email: 'test@example.com',
      };

      // Mock successful password reset request
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const { req } = createMocks({
        method: 'POST',
        body: resetData,
      });

      const response = await forgotPasswordHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('reset email sent');
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        resetData.email,
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/reset-password'),
        })
      );
    });

    it('should handle invalid email format', async () => {
      const invalidData = {
        email: 'not-an-email',
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      const response = await forgotPasswordHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('email');
    });

    it('should still return success for non-existent email (security)', async () => {
      // This prevents email enumeration attacks
      const resetData = {
        email: 'nonexistent@example.com',
      };

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: { message: 'User not found' },
      });

      const { req } = createMocks({
        method: 'POST',
        body: resetData,
      });

      const response = await forgotPasswordHandler(req as any);
      const responseData = await response.json();

      // Should still return success to prevent enumeration
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetData = {
        token: 'valid-reset-token',
        password: 'NewSecurePass123!',
      };

      // Mock successful password update
      mockSupabase.auth.updateUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const { req } = createMocks({
        method: 'POST',
        body: resetData,
      });

      const response = await resetPasswordHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('password updated');
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: resetData.password,
      });
    });

    it('should handle invalid or expired token', async () => {
      const resetData = {
        token: 'invalid-token',
        password: 'NewSecurePass123!',
      };

      mockSupabase.auth.updateUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid or expired token' },
      });

      const { req } = createMocks({
        method: 'POST',
        body: resetData,
      });

      const response = await resetPasswordHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid or expired token');
    });

    it('should validate new password strength', async () => {
      const resetData = {
        token: 'valid-reset-token',
        password: 'weak', // Too weak
      };

      const { req } = createMocks({
        method: 'POST',
        body: resetData,
      });

      const response = await resetPasswordHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('password');
    });
  });

  describe('Error handling and security', () => {
    it('should handle database connection errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      // Mock database error
      mockSupabase.auth.signUp.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('server error');
    });

    it('should sanitize error messages in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      };

      mockSupabase.auth.signUp.mockRejectedValueOnce(
        new Error('Sensitive database error with connection details')
      );

      const { req } = createMocks({
        method: 'POST',
        body: userData,
      });

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).not.toContain('connection details');
      expect(responseData.error).toContain('server error');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle malformed JSON requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        // Simulate malformed JSON by not setting body properly
      });

      // Override the json method to simulate parsing error
      req.json = jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON'));

      const response = await registerHandler(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid JSON');
    });
  });
});
