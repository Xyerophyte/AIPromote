const faker = require('faker');

// Generate test user data
function generateTestUser(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  context.vars.email = `loadtest-${timestamp}-${randomId}@example.com`;
  context.vars.password = 'LoadTest123!';
  context.vars.firstName = faker.name.firstName();
  context.vars.lastName = faker.name.lastName();
  context.vars.organizationName = `${faker.company.companyName()} ${randomId}`;
  
  return next();
}

// Get an existing test user for login
function getExistingUser(requestParams, context, ee, next) {
  // Use predefined test users or generate a consistent one
  const userIndex = Math.floor(Math.random() * 10) + 1;
  context.vars.email = `loadtest-user-${userIndex}@example.com`;
  context.vars.password = 'LoadTest123!';
  
  return next();
}

// Generate content request parameters
function generateContentRequest(requestParams, context, ee, next) {
  const platforms = ['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK'];
  const contentTypes = ['POST', 'THREAD', 'CAROUSEL'];
  const tones = ['professional', 'casual', 'friendly', 'authoritative'];
  const audiences = ['developers', 'marketers', 'entrepreneurs', 'students', 'professionals'];
  const keywords = [
    ['javascript', 'programming'],
    ['marketing', 'growth'],
    ['startup', 'business'],
    ['technology', 'innovation'],
    ['design', 'creativity'],
    ['productivity', 'efficiency']
  ];
  
  context.vars.platform = platforms[Math.floor(Math.random() * platforms.length)];
  context.vars.contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
  context.vars.tone = tones[Math.floor(Math.random() * tones.length)];
  context.vars.targetAudience = audiences[Math.floor(Math.random() * audiences.length)];
  context.vars.variationCount = Math.floor(Math.random() * 3) + 1; // 1-3 variations
  context.vars.diversityLevel = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
  
  const keywordPair = keywords[Math.floor(Math.random() * keywords.length)];
  context.vars.keyword1 = keywordPair[0];
  context.vars.keyword2 = keywordPair[1];
  
  return next();
}

// Generate scheduling request parameters
function generateScheduleRequest(requestParams, context, ee, next) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Random date within 7 days
  
  context.vars.scheduledFor = futureDate.toISOString();
  context.vars.socialAccountId = `test-account-${Math.floor(Math.random() * 10) + 1}`;
  
  return next();
}

// Log response times for monitoring
function logResponseTime(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log(`Error ${response.statusCode}: ${response.body}`);
  }
  
  const responseTime = Date.now() - context.vars.$startTime;
  if (responseTime > 2000) {
    console.log(`Slow response: ${responseTime}ms for ${requestParams.url}`);
  }
  
  return next();
}

// Setup function to create test users before load test
function setupTestUsers(context, ee, next) {
  // This would be called before the test starts
  // to pre-create some test users for consistent testing
  console.log('Setting up test users for load testing...');
  return next();
}

// Custom metrics tracking
function trackCustomMetrics(requestParams, response, context, ee, next) {
  if (response.statusCode === 200 && requestParams.url.includes('/api/v1/content/generate')) {
    ee.emit('customStat', 'content.generation.success', 1);
  }
  
  if (response.statusCode === 200 && requestParams.url.includes('/auth/login')) {
    ee.emit('customStat', 'auth.login.success', 1);
  }
  
  if (response.statusCode >= 500) {
    ee.emit('customStat', 'server.errors', 1);
  }
  
  return next();
}

// Error handling
function handleError(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`Request failed: ${requestParams.url} - Status: ${response.statusCode}`);
    console.error(`Response: ${response.body}`);
    
    // Log specific error types
    if (response.statusCode === 429) {
      ee.emit('customStat', 'rate.limit.hit', 1);
    } else if (response.statusCode >= 500) {
      ee.emit('customStat', 'server.error', 1);
    } else if (response.statusCode === 401) {
      ee.emit('customStat', 'auth.error', 1);
    }
  }
  
  return next();
}

module.exports = {
  generateTestUser,
  getExistingUser,
  generateContentRequest,
  generateScheduleRequest,
  logResponseTime,
  setupTestUsers,
  trackCustomMetrics,
  handleError
};
