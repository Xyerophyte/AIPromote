import { buildServer } from '../../../src/server';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { jest } from '@jest/globals';

describe('Auth Routes Integration Tests', () => {
  let server: FastifyInstance;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
    request = supertest(server.server);
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      organizationName: 'Test Corp'
    };

    it('should register a new user successfully', async () => {
      const response = await request
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(validRegistrationData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const response = await request
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        email: 'test2@example.com',
        password: '123'
      };

      const response = await request
        .post('/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request
        .post('/auth/register')
        .send({
          ...validRegistrationData,
          email: 'duplicate@example.com'
        })
        .expect(201);

      // Second registration with same email
      const response = await request
        .post('/auth/register')
        .send({
          ...validRegistrationData,
          email: 'duplicate@example.com'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should reject registration with missing required fields', async () => {
      const incompleteData = {
        email: 'incomplete@example.com',
        password: 'SecurePass123!'
        // Missing firstName, lastName, organizationName
      };

      const response = await request
        .post('/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      email: 'login-test@example.com',
      password: 'SecurePass123!',
      firstName: 'Login',
      lastName: 'User',
      organizationName: 'Test Corp'
    };

    beforeAll(async () => {
      // Create a test user for login tests
      await request
        .post('/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('should reject login with invalid email', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: testUser.email
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with malformed email', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: 'invalid-email-format',
          password: testUser.password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    let authToken: string;

    beforeAll(async () => {
      // Create and login a user to get auth token
      await request
        .post('/auth/register')
        .send({
          email: 'logout-test@example.com',
          password: 'SecurePass123!',
          firstName: 'Logout',
          lastName: 'User',
          organizationName: 'Test Corp'
        })
        .expect(201);

      const loginResponse = await request
        .post('/auth/login')
        .send({
          email: 'logout-test@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      authToken = loginResponse.body.token;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('logged out');
    });

    it('should reject logout without token', async () => {
      const response = await request
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authorization');
    });

    it('should reject logout with invalid token', async () => {
      const response = await request
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token');
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
      // Create and login a user to get auth token
      const registerResponse = await request
        .post('/auth/register')
        .send({
          email: 'me-test@example.com',
          password: 'SecurePass123!',
          firstName: 'Me',
          lastName: 'User',
          organizationName: 'Test Corp'
        })
        .expect(201);

      authToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should return user profile with valid token', async () => {
      const response = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', userId);
      expect(response.body.user).toHaveProperty('email', 'me-test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authorization');
    });

    it('should reject request with expired token', async () => {
      // Mock an expired token (this would need to be implemented based on your JWT logic)
      const expiredToken = 'expired-token-mock';
      
      const response = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Create a user and get refresh token
      const registerResponse = await request
        .post('/auth/register')
        .send({
          email: 'refresh-test@example.com',
          password: 'SecurePass123!',
          firstName: 'Refresh',
          lastName: 'User',
          organizationName: 'Test Corp'
        })
        .expect(201);

      refreshToken = registerResponse.body.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token).not.toBe(refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('refresh token');
    });

    it('should reject refresh without token', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeAll(async () => {
      // Create a user for password reset tests
      await request
        .post('/auth/register')
        .send({
          email: 'forgot-password@example.com',
          password: 'SecurePass123!',
          firstName: 'Forgot',
          lastName: 'Password',
          organizationName: 'Test Corp'
        })
        .expect(201);
    });

    it('should initiate password reset for existing user', async () => {
      const response = await request
        .post('/auth/forgot-password')
        .send({ email: 'forgot-password@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('password reset');
    });

    it('should handle password reset for non-existent user gracefully', async () => {
      // For security, should not reveal if email exists or not
      const response = await request
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject password reset with invalid email format', async () => {
      const response = await request
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'rate-limit-test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts rapidly
      const promises = Array(10).fill(null).map(() => 
        request.post('/auth/login').send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should rate limit registration attempts', async () => {
      const registrationRequests = Array(6).fill(null).map((_, i) => 
        request.post('/auth/register').send({
          email: `rate-limit-${i}@example.com`,
          password: 'SecurePass123!',
          firstName: 'Rate',
          lastName: 'Limit',
          organizationName: 'Test Corp'
        })
      );

      const responses = await Promise.all(registrationRequests);
      
      // Should have some rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request
        .get('/auth/me')
        .expect(401); // No auth, but we check headers

      // Check for common security headers
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input in registration', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe<?php echo "inject"; ?>',
        organizationName: 'Test Corp'
      };

      const response = await request
        .post('/auth/register')
        .send(maliciousData)
        .expect(201);

      // Should sanitize malicious content
      expect(response.body.user.firstName).not.toContain('<script>');
      expect(response.body.user.lastName).not.toContain('<?php');
    });
  });
});
