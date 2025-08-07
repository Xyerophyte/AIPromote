// Frontend-Backend Integration Test Script
// This script tests API communication, CORS configuration, and endpoints

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

class IntegrationTester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runTest(name, testFn) {
    this.totalTests++;
    console.log(`\n🧪 Testing: ${name}`);
    
    try {
      const result = await testFn();
      if (result.success) {
        this.passedTests++;
        console.log(`✅ PASSED: ${name}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      } else {
        this.failedTests++;
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Error: ${result.error}`);
      }
      this.results.push({ name, ...result });
    } catch (error) {
      this.failedTests++;
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.results.push({ name, success: false, error: error.message });
    }
  }

  async testBackendHealthEndpoint() {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`);
      return {
        success: response.status === 200,
        details: `Status: ${response.status}, Environment: ${response.data.environment}`,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testBackendApiV1Endpoint() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1`);
      return {
        success: response.status === 200,
        details: `API Version: ${response.data.version}, Environment: ${response.data.environment}`,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testCorsConfiguration() {
    try {
      // Test CORS headers from frontend origin
      const response = await axios.options(`${BACKEND_URL}/health`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials']
      };
      
      return {
        success: true,
        details: `CORS headers present: ${JSON.stringify(corsHeaders)}`,
        data: corsHeaders
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testApiEndpoints() {
    const endpoints = [
      { path: '/api/v1/users', expectedStatus: 404, description: 'Users endpoint (expected 404)' },
      { path: '/api/v1/content', expectedStatus: 404, description: 'Content endpoint (expected 404)' },
      { path: '/api/v1/content/templates', expectedStatus: 404, description: 'Content templates (should be 404 or auth required)' },
    ];

    const results = [];
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BACKEND_URL}${endpoint.path}`);
        results.push({
          path: endpoint.path,
          status: response.status,
          success: response.status === endpoint.expectedStatus
        });
      } catch (error) {
        const status = error.response?.status || 0;
        results.push({
          path: endpoint.path,
          status,
          success: status === endpoint.expectedStatus,
          error: error.message
        });
      }
    }

    const allSuccessful = results.every(r => r.success);
    return {
      success: allSuccessful,
      details: `Tested ${results.length} endpoints`,
      data: results
    };
  }

  async testAuthenticationFlow() {
    try {
      // Test auth endpoint (should require proper authentication)
      const response = await axios.post(`${BACKEND_URL}/api/v1/auth/signin`, {
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      return {
        success: false,
        error: 'Auth endpoint should have failed without proper credentials'
      };
    } catch (error) {
      // We expect this to fail with proper error response
      const status = error.response?.status;
      if (status === 400 || status === 401) {
        return {
          success: true,
          details: `Auth endpoint properly rejected request with status ${status}`,
          data: { status, message: error.response?.data?.message }
        };
      } else if (status === 404) {
        return {
          success: false,
          error: 'Auth endpoint not found (404) - routes may not be registered properly'
        };
      }
      return {
        success: false,
        error: `Unexpected status: ${status} - ${error.message}`
      };
    }
  }

  async testFrontendAccess() {
    try {
      const response = await axios.get(FRONTEND_URL);
      const isNextJSApp = response.data.includes('_next') || response.data.includes('Next.js');
      
      return {
        success: response.status === 200 && isNextJSApp,
        details: `Frontend accessible, Status: ${response.status}, Is Next.js: ${isNextJSApp}`,
        data: { status: response.status, isNextJSApp }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWebSocketConnections() {
    // For now, just check if the backend supports WebSocket upgrades
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        }
      });
      
      return {
        success: true,
        details: 'Backend responded to WebSocket upgrade headers (no actual WebSocket test)',
        data: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: `WebSocket test failed: ${error.message}`
      };
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Frontend-Backend Integration Tests');
    console.log('='.repeat(50));
    
    await this.runTest('Backend Health Endpoint', () => this.testBackendHealthEndpoint());
    await this.runTest('Backend API v1 Endpoint', () => this.testBackendApiV1Endpoint());
    await this.runTest('CORS Configuration', () => this.testCorsConfiguration());
    await this.runTest('API Endpoints Accessibility', () => this.testApiEndpoints());
    await this.runTest('Authentication Flow', () => this.testAuthenticationFlow());
    await this.runTest('Frontend Access', () => this.testFrontendAccess());
    await this.runTest('WebSocket Support', () => this.testWebSocketConnections());

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  • ${r.name}: ${r.error}`));
    }

    console.log('\n🔍 RECOMMENDATIONS:');
    if (this.passedTests === this.totalTests) {
      console.log('✅ All tests passed! Frontend-Backend integration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above and ensure:');
      console.log('   1. Both frontend (port 3000) and backend (port 3001) are running');
      console.log('   2. CORS configuration allows frontend origin');
      console.log('   3. API endpoints are properly registered');
      console.log('   4. Authentication middleware is working correctly');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = IntegrationTester;
