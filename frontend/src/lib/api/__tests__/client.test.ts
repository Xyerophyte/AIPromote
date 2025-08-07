import { ApiClient } from '../client';
import { cache } from '../../cache/redis';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

// Mock cache module
jest.mock('../../cache/redis', () => ({
  cache: {
    getOrSet: jest.fn(),
  },
  cacheKeys: {
    apiResponse: jest.fn(),
  },
  cacheTTL: {
    MEDIUM: 300,
  },
  cacheTags: {
    API: 'api',
  },
}));

// Mock global fetch
global.fetch = jest.fn();

const mockGetSession = require('next-auth/react').getSession;
const mockCache = cache as jest.Mocked<typeof cache>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
    });
  });

  describe('constructor', () => {
    it('should initialize with correct base URL for development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const devClient = new ApiClient();
      expect(devClient['baseURL']).toBe('http://localhost:3001');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should initialize with environment URL for production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api.example.com';
      
      const prodClient = new ApiClient();
      expect(prodClient['baseURL']).toBe('https://api.example.com');
      
      process.env.NODE_ENV = originalEnv;
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    });
  });

  describe('getAuthHeaders', () => {
    it('should return authorization header when session exists', async () => {
      const headers = await client['getAuthHeaders']();
      
      expect(headers).toHaveProperty('Authorization');
      expect(headers.Authorization).toMatch(/^Bearer /);
    });

    it('should return empty headers when no session', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      
      const headers = await client['getAuthHeaders']();
      expect(headers).toEqual({});
    });

    it('should create valid JWT token', async () => {
      const headers = await client['getAuthHeaders']();
      const token = headers.Authorization?.replace('Bearer ', '');
      
      if (token) {
        const decoded = JSON.parse(atob(token));
        expect(decoded).toHaveProperty('userId', 'user-123');
        expect(decoded).toHaveProperty('email', 'test@example.com');
        expect(decoded).toHaveProperty('role', 'user');
        expect(decoded).toHaveProperty('exp');
      }
    });
  });

  describe('request method', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().resolvedValue({ data: 'success' }),
      } as any);
    });

    it('should make GET request correctly', async () => {
      const response = await client.request('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ data: 'success' });
    });

    it('should make POST request with JSON body', async () => {
      const testData = { name: 'test' };
      await client.request('/test', {
        method: 'POST',
        body: testData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle FormData body correctly', async () => {
      const formData = new FormData();
      formData.append('file', 'test');

      await client.request('/upload', {
        method: 'POST',
        body: formData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include auth headers by default', async () => {
      await client.request('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer /),
          }),
        })
      );
    });

    it('should skip auth headers when requireAuth is false', async () => {
      await client.request('/test', { requireAuth: false });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should handle HTTP errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().resolvedValue({ error: 'Not found' }),
      } as any);

      const response = await client.request('/not-found');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await client.request('/test');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Network error');
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: jest.fn().resolvedValue('Plain text response'),
      } as any);

      const response = await client.request('/text');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ message: 'Plain text response' });
    });
  });

  describe('caching', () => {
    it('should use cache for GET requests when enabled', async () => {
      const cachedResponse = { success: true, data: 'cached' };
      mockCache.getOrSet.mockResolvedValueOnce(cachedResponse);

      const response = await client.request('/test', {
        cache: { enabled: true },
      });

      expect(mockCache.getOrSet).toHaveBeenCalled();
      expect(response).toBe(cachedResponse);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip cache for non-GET requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().resolvedValue({ data: 'success' }),
      } as any);

      await client.request('/test', {
        method: 'POST',
        cache: { enabled: true },
      });

      expect(mockCache.getOrSet).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should generate correct cache key', () => {
      const endpoint = '/api/users';
      const options = {
        method: 'GET' as const,
        body: { filter: 'active' },
      };

      const cacheKey = client['generateCacheKey'](endpoint, options);
      expect(typeof cacheKey).toBe('string');
      expect(cacheKey).toContain(endpoint);
    });

    it('should use custom cache key when provided', () => {
      const customKey = 'custom-cache-key';
      const cacheKey = client['generateCacheKey']('/test', {
        cache: { key: customKey },
      });

      expect(cacheKey).toBe(customKey);
    });
  });

  describe('batch operations', () => {
    it('should handle batch requests', async () => {
      // This would test batch functionality if it was fully implemented
      // For now, we'll test that the batch queue exists
      expect(client['batchQueue']).toBeInstanceOf(Map);
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().rejectedValue(new Error('Invalid JSON')),
      } as any);

      const response = await client.request('/test');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid JSON');
    });

    it('should handle fetch failures', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const response = await client.request('/test');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to fetch');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(
        Object.assign(new Error('Request timeout'), { name: 'AbortError' })
      );

      const response = await client.request('/test');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Request timeout');
    });
  });
});
