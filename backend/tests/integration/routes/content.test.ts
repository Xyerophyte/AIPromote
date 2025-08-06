import { buildServer } from '../../../src/server';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { jest } from '@jest/globals';

describe('Content Routes Integration Tests', () => {
  let server: FastifyInstance;
  let request: supertest.SuperTest<supertest.Test>;
  let authToken: string;
  let organizationId: string;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
    request = supertest(server.server);

    // Create a test user and get auth token
    const registerResponse = await request
      .post('/auth/register')
      .send({
        email: 'content-test@example.com',
        password: 'SecurePass123!',
        firstName: 'Content',
        lastName: 'Tester',
        organizationName: 'Content Test Corp'
      })
      .expect(201);

    authToken = registerResponse.body.token;
    organizationId = registerResponse.body.user.organizationId;
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/v1/content/generate', () => {
    const validGenerationRequest = {
      platform: 'TWITTER',
      contentType: 'POST',
      context: {
        targetAudience: 'developers',
        tone: 'professional',
        objective: 'engagement',
        keywords: ['javascript', 'programming']
      },
      variations: {
        count: 3,
        diversityLevel: 'medium'
      },
      optimization: {
        seo: true,
        engagement: true,
        conversion: false,
        brandSafety: true
      }
    };

    it('should generate content successfully with valid request', async () => {
      const response = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validGenerationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('platform', 'TWITTER');
      expect(response.body).toHaveProperty('contentType', 'POST');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('variations');
      expect(response.body).toHaveProperty('optimization');

      expect(response.body.content).toHaveProperty('body');
      expect(response.body.content).toHaveProperty('hashtags');
      expect(Array.isArray(response.body.content.hashtags)).toBe(true);
      expect(Array.isArray(response.body.variations)).toBe(true);
    });

    it('should reject content generation without authentication', async () => {
      const response = await request
        .post('/api/v1/content/generate')
        .send(validGenerationRequest)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Authorization');
    });

    it('should validate platform parameter', async () => {
      const invalidRequest = {
        ...validGenerationRequest,
        platform: 'INVALID_PLATFORM'
      };

      const response = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('platform');
    });

    it('should validate content type parameter', async () => {
      const invalidRequest = {
        ...validGenerationRequest,
        contentType: 'INVALID_TYPE'
      };

      const response = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle generation with minimal parameters', async () => {
      const minimalRequest = {
        platform: 'LINKEDIN',
        contentType: 'POST',
        variations: { count: 1, diversityLevel: 'low' },
        optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
      };

      const response = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalRequest)
        .expect(200);

      expect(response.body.platform).toBe('LINKEDIN');
      expect(response.body.variations).toHaveLength(1);
    });

    it('should generate multiple variations when requested', async () => {
      const multiVariationRequest = {
        ...validGenerationRequest,
        variations: { count: 5, diversityLevel: 'high' }
      };

      const response = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(multiVariationRequest)
        .expect(200);

      expect(response.body.variations.length).toBeGreaterThanOrEqual(3);
      expect(response.body.variations.length).toBeLessThanOrEqual(5);
    });

    it('should apply platform-specific optimization rules', async () => {
      const twitterRequest = {
        ...validGenerationRequest,
        platform: 'TWITTER'
      };

      const linkedinRequest = {
        ...validGenerationRequest,
        platform: 'LINKEDIN'
      };

      const [twitterResponse, linkedinResponse] = await Promise.all([
        request
          .post('/api/v1/content/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(twitterRequest)
          .expect(200),
        request
          .post('/api/v1/content/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(linkedinRequest)
          .expect(200)
      ]);

      // Twitter content should be shorter than LinkedIn content typically
      expect(twitterResponse.body.content.body.length).toBeLessThanOrEqual(280);
      expect(linkedinResponse.body.platform).toBe('LINKEDIN');
    });
  });

  describe('GET /api/v1/content', () => {
    beforeAll(async () => {
      // Generate some test content first
      await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'TWITTER',
          contentType: 'POST',
          variations: { count: 1, diversityLevel: 'low' },
          optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
        });
    });

    it('should return list of generated content', async () => {
      const response = await request
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.content)).toBe(true);
    });

    it('should filter content by platform', async () => {
      const response = await request
        .get('/api/v1/content?platform=TWITTER')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.content.length > 0) {
        response.body.content.forEach((content: any) => {
          expect(content.platform).toBe('TWITTER');
        });
      }
    });

    it('should filter content by status', async () => {
      const response = await request
        .get('/api/v1/content?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });

    it('should paginate content results', async () => {
      const response = await request
        .get('/api/v1/content?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.content.length).toBeLessThanOrEqual(5);
    });

    it('should search content by query', async () => {
      const response = await request
        .get('/api/v1/content?search=javascript')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });

    it('should require authentication', async () => {
      const response = await request
        .get('/api/v1/content')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should sort content by creation date', async () => {
      const response = await request
        .get('/api/v1/content?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.content.length > 1) {
        const dates = response.body.content.map((c: any) => new Date(c.createdAt));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      }
    });
  });

  describe('GET /api/v1/content/:id', () => {
    let contentId: string;

    beforeAll(async () => {
      // Generate test content and get its ID
      const generateResponse = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'TWITTER',
          contentType: 'POST',
          variations: { count: 1, diversityLevel: 'low' },
          optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
        });
      
      contentId = generateResponse.body.id;
    });

    it('should return specific content by ID', async () => {
      const response = await request
        .get(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', contentId);
      expect(response.body).toHaveProperty('platform');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('metadata');
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request
        .get('/api/v1/content/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request
        .get(`/api/v1/content/${contentId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/content/:id', () => {
    let contentId: string;

    beforeAll(async () => {
      const generateResponse = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'TWITTER',
          contentType: 'POST',
          variations: { count: 1, diversityLevel: 'low' },
          optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
        });
      
      contentId = generateResponse.body.id;
    });

    it('should update content successfully', async () => {
      const updateData = {
        content: {
          body: 'Updated content body',
          hashtags: ['#updated', '#test']
        },
        status: 'APPROVED'
      };

      const response = await request
        .put(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.content.body).toBe('Updated content body');
      expect(response.body.content.hashtags).toContain('#updated');
      expect(response.body.status).toBe('APPROVED');
    });

    it('should validate update data', async () => {
      const invalidData = {
        status: 'INVALID_STATUS'
      };

      const response = await request
        .put(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request
        .put(`/api/v1/content/${contentId}`)
        .send({ status: 'APPROVED' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/v1/content/:id', () => {
    let contentId: string;

    beforeEach(async () => {
      const generateResponse = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'TWITTER',
          contentType: 'POST',
          variations: { count: 1, diversityLevel: 'low' },
          optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
        });
      
      contentId = generateResponse.body.id;
    });

    it('should delete content successfully', async () => {
      const response = await request
        .delete(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Verify content is deleted
      await request
        .get(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request
        .delete('/api/v1/content/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request
        .delete(`/api/v1/content/${contentId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/content/:id/schedule', () => {
    let contentId: string;

    beforeAll(async () => {
      const generateResponse = await request
        .post('/api/v1/content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'TWITTER',
          contentType: 'POST',
          variations: { count: 1, diversityLevel: 'low' },
          optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
        });
      
      contentId = generateResponse.body.id;
    });

    it('should schedule content successfully', async () => {
      const scheduleData = {
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        socialAccountId: 'test-account-id'
      };

      const response = await request
        .post(`/api/v1/content/${contentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData)
        .expect(200);

      expect(response.body).toHaveProperty('scheduledPost');
      expect(response.body.scheduledPost).toHaveProperty('id');
      expect(response.body.scheduledPost.contentId).toBe(contentId);
    });

    it('should validate schedule date is in future', async () => {
      const pastDate = {
        scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        socialAccountId: 'test-account-id'
      };

      const response = await request
        .post(`/api/v1/content/${contentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(pastDate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('future');
    });

    it('should require social account ID', async () => {
      const response = await request
        .post(`/api/v1/content/${contentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/content/bulk-generate', () => {
    it('should generate multiple content pieces in bulk', async () => {
      const bulkRequest = {
        requests: [
          {
            platform: 'TWITTER',
            contentType: 'POST',
            variations: { count: 1, diversityLevel: 'low' },
            optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
          },
          {
            platform: 'LINKEDIN',
            contentType: 'POST',
            variations: { count: 1, diversityLevel: 'low' },
            optimization: { seo: true, engagement: true, conversion: false, brandSafety: true }
          }
        ]
      };

      const response = await request
        .post('/api/v1/content/bulk-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkRequest)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results).toHaveLength(2);
      
      expect(response.body.results[0].platform).toBe('TWITTER');
      expect(response.body.results[1].platform).toBe('LINKEDIN');
    });

    it('should handle partial failures in bulk generation', async () => {
      const bulkRequest = {
        requests: [
          {
            platform: 'TWITTER',
            contentType: 'POST',
            variations: { count: 1, diversityLevel: 'low' },
            optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
          },
          {
            platform: 'INVALID_PLATFORM',
            contentType: 'POST',
            variations: { count: 1, diversityLevel: 'low' },
            optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
          }
        ]
      };

      const response = await request
        .post('/api/v1/content/bulk-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkRequest)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.errors).toHaveLength(1);
    });

    it('should limit bulk request size', async () => {
      const largeRequest = {
        requests: Array(51).fill(null).map(() => ({
          platform: 'TWITTER',
          contentType: 'POST',
          variations: { count: 1, diversityLevel: 'low' },
          optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
        }))
      };

      const response = await request
        .post('/api/v1/content/bulk-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('limit');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit content generation requests', async () => {
      const promises = Array(20).fill(null).map(() =>
        request
          .post('/api/v1/content/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            platform: 'TWITTER',
            contentType: 'POST',
            variations: { count: 1, diversityLevel: 'low' },
            optimization: { seo: false, engagement: true, conversion: false, brandSafety: true }
          })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
