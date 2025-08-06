# Comprehensive Testing Suite

This document outlines the comprehensive testing strategy and implementation for the AI Promote backend application.

## 🧪 Testing Strategy

Our testing suite includes multiple layers of testing to ensure code quality, reliability, and performance:

1. **Unit Tests** - Test individual components and functions in isolation
2. **Integration Tests** - Test API endpoints and database interactions
3. **End-to-End (E2E) Tests** - Test complete user workflows
4. **Component Tests** - Test React components (for admin frontend)
5. **Load Tests** - Test system performance under various load conditions
6. **Security Tests** - Test for vulnerabilities and security issues

## 🏗️ Test Structure

```
tests/
├── setup.ts                 # Global test setup and mocks
├── unit/                    # Unit tests
│   ├── services/           # Service layer tests
│   ├── middleware/         # Middleware tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests
│   ├── routes/            # API endpoint tests
│   └── database/          # Database integration tests
└── load/                  # Load testing scripts
    ├── load-test.yml      # Artillery configuration
    └── load-test-functions.js # Test helper functions

cypress/
├── e2e/                   # End-to-end tests
├── component/             # Component tests
└── support/               # Cypress support files
```

## 🚀 Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up test environment variables:
```bash
cp .env.example .env.test
# Edit .env.test with test-specific values
```

3. Set up test database:
```bash
npm run db:push
npm run db:seed
```

### Running Different Test Types

#### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit -- --coverage

# Run unit tests in watch mode
npm run test:watch

# Run specific unit test file
npm run test:unit -- services/content-generation.test.ts
```

#### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run integration tests with coverage
npm run test:integration -- --coverage

# Run specific integration test
npm run test:integration -- routes/auth.test.ts
```

#### End-to-End Tests
```bash
# Run E2E tests headlessly
npm run test:e2e

# Open Cypress GUI for interactive testing
npm run test:e2e:open
```

#### Component Tests
```bash
# Run component tests
npx cypress run --component

# Open component testing GUI
npx cypress open --component
```

#### Load Tests
```bash
# Run full load test suite
npm run test:load

# Run quick load test
npm run test:load:quick
```

#### All Tests
```bash
# Run unit, integration, and E2E tests
npm run test:all
```

## 📊 Coverage Reporting

### Generate Coverage Reports
```bash
# Generate HTML coverage report
npm run coverage:report

# Check coverage thresholds
npm run coverage:check
```

### Coverage Thresholds
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Coverage reports are available in the `coverage/` directory after running tests.

## 🔧 Test Configuration

### Jest Configuration
- **Config File**: `jest.config.js`
- **Setup File**: `tests/setup.ts`
- **Environment**: Node.js with comprehensive mocks for external services

### Cypress Configuration
- **Config File**: `cypress.config.ts`
- **Support Files**: `cypress/support/`
- **Commands**: Custom commands for common testing operations

### Artillery Configuration
- **Config File**: `tests/load/load-test.yml`
- **Helper Functions**: `tests/load/load-test-functions.js`
- **Test Data**: `tests/load/test-users.csv`

## 🎯 Testing Best Practices

### Unit Tests
1. Test one thing at a time
2. Use descriptive test names
3. Mock external dependencies
4. Test both success and error scenarios
5. Keep tests fast and isolated

### Integration Tests
1. Test real API endpoints
2. Use test database transactions
3. Test authentication and authorization
4. Validate response schemas
5. Test error handling

### E2E Tests
1. Test critical user journeys
2. Use data attributes for element selection
3. Clean up test data after each test
4. Test across different user roles
5. Include accessibility testing

### Load Tests
1. Test realistic user scenarios
2. Gradually increase load
3. Monitor key performance metrics
4. Test system recovery
5. Document performance thresholds

## 📋 Test Scenarios

### Authentication Flow
- [ ] User registration with valid data
- [ ] User registration with invalid data
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] Password reset flow
- [ ] Token refresh mechanism
- [ ] Session management
- [ ] Rate limiting enforcement

### Content Generation
- [ ] Generate content for different platforms
- [ ] Generate content variations
- [ ] Apply platform-specific optimization
- [ ] Handle invalid input parameters
- [ ] Test AI provider fallbacks
- [ ] Content validation and sanitization

### Content Management
- [ ] List user's content with pagination
- [ ] Filter content by platform/status
- [ ] Update content successfully
- [ ] Delete content with proper authorization
- [ ] Schedule content for future posting
- [ ] Bulk operations

### Analytics Dashboard
- [ ] Retrieve dashboard data
- [ ] Filter analytics by date range
- [ ] Export analytics data
- [ ] Real-time metrics updates
- [ ] Performance metrics calculation

### Social Media Integration
- [ ] Connect social media accounts
- [ ] Publish content to platforms
- [ ] Retrieve post analytics
- [ ] Handle API rate limits
- [ ] Error handling for failed posts

## 🚨 Continuous Integration

### GitHub Actions Pipeline
The CI/CD pipeline runs automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled nightly runs

### Pipeline Stages
1. **Code Quality** - Linting, formatting, type checking
2. **Unit Tests** - Fast isolated tests
3. **Integration Tests** - API and database tests
4. **E2E Tests** - User workflow validation
5. **Security Scans** - Vulnerability detection
6. **Load Tests** - Performance validation
7. **Coverage Reports** - Test coverage analysis
8. **Docker Build** - Container testing
9. **Deployment Check** - Production readiness

### Quality Gates
Tests must pass before code can be merged:
- All unit tests pass
- All integration tests pass
- All E2E tests pass
- Coverage thresholds met
- Security scans pass
- No critical linting errors

## 🐛 Debugging Tests

### Common Issues

#### Test Database
```bash
# Reset test database
npm run db:reset

# Check database connection
npm run db:studio
```

#### Redis Connection
```bash
# Check Redis status
redis-cli ping

# Clear Redis data
redis-cli flushdb
```

#### Mock Services
- Ensure external service mocks are properly configured
- Check mock responses match expected format
- Verify API keys are set for test environment

### Debugging Tips
1. Use `console.log` for debugging (remove before commit)
2. Run tests in isolation to identify issues
3. Check test setup and teardown
4. Verify test data is properly cleaned up
5. Use Cypress GUI for visual E2E debugging

## 📈 Performance Testing

### Load Testing Scenarios
1. **Authentication Load** - High volume login/registration
2. **Content Generation** - AI service stress testing
3. **API Throughput** - Content management operations
4. **Database Performance** - Analytics queries under load
5. **Real-time Features** - WebSocket connections

### Performance Metrics
- Response time percentiles (p50, p95, p99)
- Request per second (RPS)
- Error rate thresholds
- Resource utilization
- Database query performance

### Alerting Thresholds
- Response time > 2 seconds (warning)
- Response time > 5 seconds (critical)
- Error rate > 5% (warning)
- Error rate > 10% (critical)

## 🔒 Security Testing

### Security Test Coverage
- Input validation and sanitization
- Authentication and authorization
- SQL injection prevention
- XSS protection
- Rate limiting effectiveness
- Sensitive data exposure

### Security Tools
- **npm audit** - Dependency vulnerability scanning
- **Snyk** - Advanced security scanning
- **Custom tests** - Application-specific security tests

## 📝 Adding New Tests

### Unit Test Example
```typescript
// tests/unit/services/example.test.ts
import { ExampleService } from '../../../src/services/example';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService();
  });

  it('should perform expected operation', async () => {
    const result = await service.operation('input');
    expect(result).toEqual('expected output');
  });
});
```

### Integration Test Example
```typescript
// tests/integration/routes/example.test.ts
import { buildServer } from '../../../src/server';
import supertest from 'supertest';

describe('Example API', () => {
  let server: FastifyInstance;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    server = await buildServer();
    request = supertest(server.server);
  });

  it('should handle API request', async () => {
    const response = await request
      .post('/api/example')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

### E2E Test Example
```typescript
// cypress/e2e/example.cy.ts
describe('Example User Flow', () => {
  it('should complete user journey', () => {
    cy.visit('/');
    cy.get('[data-cy=action-button]').click();
    cy.url().should('include', '/expected-page');
    cy.contains('Success message').should('be.visible');
  });
});
```

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all test types are covered
3. Update this documentation if needed
4. Run full test suite before submitting PR
5. Include test scenarios in PR description

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Library Documentation](https://testing-library.com/)
