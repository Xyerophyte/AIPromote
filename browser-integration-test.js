// Browser DevTools Integration Test Script
// Copy and paste this into your browser console to test frontend-backend integration

console.log('🚀 Starting Browser Integration Tests...');

const BACKEND_URL = 'http://localhost:3001';

// Test functions
const tests = {
  async testHealth() {
    console.log('\n🧪 Testing Health Endpoint...');
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health Check:', data);
        return true;
      } else {
        console.error('❌ Health Check Failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Health Check Error:', error.message);
      return false;
    }
  },

  async testCORS() {
    console.log('\n🧪 Testing CORS...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ CORS Working:', data);
        return true;
      } else {
        console.error('❌ CORS Failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ CORS Error:', error.message);
      if (error.message.includes('CORS')) {
        console.error('💡 CORS is not properly configured!');
      }
      return false;
    }
  },

  async testAPIEndpoints() {
    console.log('\n🧪 Testing API Endpoints...');
    
    const endpoints = [
      { path: '/api/v1/auth/signin', method: 'POST', expectedFail: true },
      { path: '/api/v1/content/templates', method: 'GET', expectedFail: true },
      { path: '/api/v1/users', method: 'GET', expectedFail: true }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BACKEND_URL}${endpoint.path}`, {
          method: endpoint.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          ...(endpoint.method === 'POST' && {
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'testpass'
            })
          })
        });

        if (response.status === 404 && endpoint.expectedFail) {
          console.log(`✅ ${endpoint.method} ${endpoint.path}: Expected 404`);
        } else if (response.status === 401) {
          console.log(`✅ ${endpoint.method} ${endpoint.path}: Auth required (401)`);
        } else if (response.ok) {
          console.log(`✅ ${endpoint.method} ${endpoint.path}: Success`);
        } else {
          console.log(`⚠️ ${endpoint.method} ${endpoint.path}: Status ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ ${endpoint.method} ${endpoint.path}:`, error.message);
      }
    }
  },

  async testNetworkTab() {
    console.log('\n🧪 Network Tab Test - Make a request and check DevTools Network tab');
    
    // Create a unique timestamp to identify this request
    const timestamp = Date.now();
    
    try {
      const response = await fetch(`${BACKEND_URL}/health?test=${timestamp}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log(`✅ Test request sent with timestamp: ${timestamp}`);
      console.log('👀 Check Network tab for:');
      console.log('   - Request URL contains timestamp');
      console.log('   - Status: 200');
      console.log('   - No CORS errors');
      console.log('   - Response headers include CORS headers');
      
      return true;
    } catch (error) {
      console.error('❌ Network test failed:', error);
      return false;
    }
  },

  async testWebSocketSupport() {
    console.log('\n🧪 Testing WebSocket Support...');
    
    try {
      // Test WebSocket upgrade headers
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        }
      });
      
      console.log('✅ WebSocket headers test completed');
      console.log('💡 For real WebSocket testing, implement WebSocket endpoints');
      return true;
    } catch (error) {
      console.error('❌ WebSocket test error:', error);
      return false;
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('=' .repeat(50));
  console.log('🔍 Browser Integration Test Results');
  console.log('='.repeat(50));

  const results = {
    health: await tests.testHealth(),
    cors: await tests.testCORS(),
    endpoints: await tests.testAPIEndpoints(),
    network: await tests.testNetworkTab(),
    websocket: await tests.testWebSocketSupport()
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.');
  }

  console.log('\n💡 Additional Testing Tips:');
  console.log('1. Open DevTools Network tab before running tests');
  console.log('2. Check Console tab for any error messages');
  console.log('3. Look for CORS preflight OPTIONS requests');
  console.log('4. Verify response headers include security headers');
  console.log('5. Test authentication flow when endpoints are fixed');

  return results;
}

// Additional utility functions for manual testing
window.testBackendConnection = async function(endpoint = '/health') {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response:', response.status, data);
    return { status: response.status, data };
  } catch (error) {
    console.error('Error:', error);
    return { error: error.message };
  }
};

window.testCORSHeaders = function() {
  console.log('Check these CORS headers in Network tab:');
  console.log('- Access-Control-Allow-Origin: http://localhost:3000');
  console.log('- Access-Control-Allow-Methods: GET,HEAD,POST');  
  console.log('- Access-Control-Allow-Credentials: true');
  return 'Check Network tab for CORS headers';
};

// Auto-run tests
runAllTests().catch(console.error);

console.log('\n🔧 Manual Testing Functions Available:');
console.log('- testBackendConnection("/api/v1")');
console.log('- testCORSHeaders()');
console.log('- runAllTests()');
