import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiCallsCounter = new Counter('api_calls_total');
const apiResponseTime = new Trend('api_response_time');

// Test configuration options
export const options = {
  stages: [
    // Warm up
    { duration: '2m', target: 10 },
    // Ramp up to normal load
    { duration: '5m', target: 50 },
    // Stay at normal load
    { duration: '10m', target: 50 },
    // Ramp up to high load
    { duration: '5m', target: 100 },
    // Stay at high load
    { duration: '10m', target: 100 },
    // Peak load test
    { duration: '2m', target: 200 },
    // Stay at peak
    { duration: '3m', target: 200 },
    // Ramp down
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    // 90% of requests should complete within 500ms
    'http_req_duration': ['p(90) < 500'],
    // 95% of requests should complete within 1000ms
    'http_req_duration': ['p(95) < 1000'],
    // 99% of requests should complete within 2000ms
    'http_req_duration': ['p(99) < 2000'],
    // Error rate should be below 1%
    'errors': ['rate < 0.01'],
    // 95% of requests should receive a response
    'http_req_failed': ['rate < 0.05'],
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Test users for authentication
const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
  { email: 'loadtest4@example.com', password: 'LoadTest123!' },
  { email: 'loadtest5@example.com', password: 'LoadTest123!' },
];

// Sample startup data for testing
const sampleStartupData = {
  name: `LoadTest Startup ${Math.random().toString(36).substring(7)}`,
  tagline: 'A revolutionary AI-powered platform for load testing',
  description: 'We are building the next generation of load testing tools that will transform how developers validate their applications under stress.',
  category: 'DevTools',
  stage: 'seed',
  markets: ['United States', 'Europe'],
  languages: ['English'],
};

// Content generation data
const sampleContentData = {
  platform: 'TWITTER',
  contentType: 'POST',
  targetAudience: 'developers',
  tone: 'professional',
  keywords: ['development', 'testing', 'performance'],
  variations: 3,
};

export function setup() {
  // Setup phase - create test users if needed
  console.log('Setting up load test environment...');
  
  // Register test users (in real scenario, these would be pre-created)
  testUsers.forEach((user, index) => {
    const registerResponse = http.post(`${API_URL}/auth/register`, JSON.stringify({
      email: user.email,
      password: user.password,
      firstName: `LoadTest${index + 1}`,
      lastName: 'User',
      organizationName: `LoadTest Org ${index + 1}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (registerResponse.status === 201 || registerResponse.status === 400) {
      // 201 = created, 400 = already exists (acceptable for load testing)
      console.log(`Test user ${user.email} ready`);
    }
  });

  return { testUsers, sampleStartupData, sampleContentData };
}

export default function (data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  
  // Test 1: Health Check (10% of requests)
  if (Math.random() < 0.1) {
    testHealthCheck();
  }
  
  // Test 2: Authentication Flow (20% of requests)
  else if (Math.random() < 0.3) {
    testAuthenticationFlow(user);
  }
  
  // Test 3: Startup Management (30% of requests)
  else if (Math.random() < 0.6) {
    testStartupManagement(user, data.sampleStartupData);
  }
  
  // Test 4: Content Generation (25% of requests)
  else if (Math.random() < 0.85) {
    testContentGeneration(user, data.sampleContentData);
  }
  
  // Test 5: File Upload (15% of requests)
  else {
    testFileUpload(user);
  }

  sleep(1); // 1 second pause between iterations
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/api/health`);
  
  apiCallsCounter.add(1);
  apiResponseTime.add(response.timings.duration);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testAuthenticationFlow(user) {
  // Step 1: Login
  const loginResponse = http.post(`${API_URL}/auth/signin`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  apiCallsCounter.add(1);
  apiResponseTime.add(loginResponse.timings.duration);
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token || body.access_token;
      } catch {
        return false;
      }
    },
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }

  // Extract auth token for subsequent requests
  let authToken = null;
  try {
    const loginBody = JSON.parse(loginResponse.body);
    authToken = loginBody.token || loginBody.access_token;
  } catch (e) {
    // Handle cases where auth is managed via cookies
  }

  // Step 2: Verify session
  const headers = authToken 
    ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const sessionResponse = http.get(`${API_URL}/auth/session`, {
    headers,
  });

  apiCallsCounter.add(1);
  apiResponseTime.add(sessionResponse.timings.duration);

  const sessionSuccess = check(sessionResponse, {
    'session status is 200': (r) => r.status === 200,
    'session response has user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.user && body.user.email;
      } catch {
        return false;
      }
    },
  });

  if (!sessionSuccess) {
    errorRate.add(1);
  }
}

function testStartupManagement(user, startupData) {
  // Login first to get auth
  const loginResponse = http.post(`${API_URL}/auth/signin`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status !== 200) {
    errorRate.add(1);
    return;
  }

  let authToken = null;
  try {
    const loginBody = JSON.parse(loginResponse.body);
    authToken = loginBody.token || loginBody.access_token;
  } catch (e) {
    // Handle cookie-based auth
  }

  const headers = authToken 
    ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // Step 1: Create startup
  const createResponse = http.post(`${API_URL}/startups`, JSON.stringify({
    ...startupData,
    name: `${startupData.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  }), { headers });

  apiCallsCounter.add(1);
  apiResponseTime.add(createResponse.timings.duration);

  const createSuccess = check(createResponse, {
    'create startup status is 201': (r) => r.status === 201,
    'create response has startup ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id || body.data?.id;
      } catch {
        return false;
      }
    },
    'create response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (!createSuccess) {
    errorRate.add(1);
    return;
  }

  // Get startup ID for subsequent operations
  let startupId = null;
  try {
    const createBody = JSON.parse(createResponse.body);
    startupId = createBody.id || createBody.data?.id;
  } catch (e) {
    errorRate.add(1);
    return;
  }

  // Step 2: Fetch startup details
  const fetchResponse = http.get(`${API_URL}/startups/${startupId}`, { headers });

  apiCallsCounter.add(1);
  apiResponseTime.add(fetchResponse.timings.duration);

  const fetchSuccess = check(fetchResponse, {
    'fetch startup status is 200': (r) => r.status === 200,
    'fetch response has startup data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.name || body.data?.name;
      } catch {
        return false;
      }
    },
  });

  if (!fetchSuccess) {
    errorRate.add(1);
  }

  // Step 3: Update startup (50% chance)
  if (Math.random() < 0.5) {
    const updateResponse = http.put(`${API_URL}/startups/${startupId}`, JSON.stringify({
      tagline: `Updated tagline at ${new Date().toISOString()}`,
      description: startupData.description + ' (Updated during load test)',
    }), { headers });

    apiCallsCounter.add(1);
    apiResponseTime.add(updateResponse.timings.duration);

    const updateSuccess = check(updateResponse, {
      'update startup status is 200': (r) => r.status === 200,
      'update response time < 1500ms': (r) => r.timings.duration < 1500,
    });

    if (!updateSuccess) {
      errorRate.add(1);
    }
  }
}

function testContentGeneration(user, contentData) {
  // Login first
  const loginResponse = http.post(`${API_URL}/auth/signin`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status !== 200) {
    errorRate.add(1);
    return;
  }

  let authToken = null;
  try {
    const loginBody = JSON.parse(loginResponse.body);
    authToken = loginBody.token || loginBody.access_token;
  } catch (e) {
    // Handle cookie-based auth
  }

  const headers = authToken 
    ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // Generate content - this is typically a heavy operation
  const generateResponse = http.post(`${API_URL}/content/generate`, JSON.stringify({
    ...contentData,
    context: {
      companyName: 'LoadTest Startup',
      industry: 'Technology',
      targetAudience: contentData.targetAudience,
    },
  }), { 
    headers,
    timeout: '30s', // Longer timeout for AI operations
  });

  apiCallsCounter.add(1);
  apiResponseTime.add(generateResponse.timings.duration);

  const generateSuccess = check(generateResponse, {
    'content generation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'content generation response has content': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.content || body.data?.content || body.variations;
      } catch {
        return false;
      }
    },
    'content generation response time < 10000ms': (r) => r.timings.duration < 10000,
  });

  if (!generateSuccess) {
    errorRate.add(1);
  }
}

function testFileUpload(user) {
  // Login first
  const loginResponse = http.post(`${API_URL}/auth/signin`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status !== 200) {
    errorRate.add(1);
    return;
  }

  let authToken = null;
  try {
    const loginBody = JSON.parse(loginResponse.body);
    authToken = loginBody.token || loginBody.access_token;
  } catch (e) {
    // Handle cookie-based auth
  }

  // Create a mock file for upload
  const fileContent = 'This is a test file for load testing purposes. '.repeat(100);
  const formData = {
    file: http.file(fileContent, 'loadtest.txt', 'text/plain'),
    type: 'logo',
  };

  const headers = authToken 
    ? { 'Authorization': `Bearer ${authToken}` }
    : {};

  const uploadResponse = http.post(`${API_URL}/upload`, formData, { 
    headers,
    timeout: '15s',
  });

  apiCallsCounter.add(1);
  apiResponseTime.add(uploadResponse.timings.duration);

  const uploadSuccess = check(uploadResponse, {
    'file upload status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'upload response has file URL': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.url || body.data?.url;
      } catch {
        return false;
      }
    },
    'upload response time < 5000ms': (r) => r.timings.duration < 5000,
  });

  if (!uploadSuccess) {
    errorRate.add(1);
  }
}

export function teardown(data) {
  // Cleanup phase - remove test data if needed
  console.log('Cleaning up load test environment...');
  
  // In a real scenario, you might want to clean up test data
  // For load testing, we usually leave the data for analysis
}

// Export metrics for monitoring
export { errorRate, apiCallsCounter, apiResponseTime };
