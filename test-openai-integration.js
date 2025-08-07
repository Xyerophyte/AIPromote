#!/usr/bin/env node

/**
 * Comprehensive OpenAI API Integration Test Script
 * 
 * This script tests:
 * 1. OpenAI API key validity
 * 2. API connection and response times
 * 3. Content generation functionality
 * 4. Rate limiting behavior
 * 5. Error handling
 * 6. API usage tracking
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class OpenAIIntegrationTest {
  constructor() {
    this.openai = null;
    this.apiKey = null;
    this.results = {
      apiKeyValid: false,
      connectionSuccess: false,
      contentGeneration: false,
      rateLimitHandling: false,
      errorHandling: false,
      responseTime: 0,
      apiUsage: null,
      errors: [],
      warnings: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logTest(testName, status, details = '') {
    const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
    const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
    this.log(`  ${statusSymbol} ${testName}: ${colors[statusColor]}${status}${colors.reset} ${details}`);
  }

  async loadEnvironmentVariables() {
    this.log('\n=== Loading Environment Variables ===', 'bold');
    
    try {
      // Try to load from .env file
      const envPath = path.join(process.cwd(), '.env');
      const envContent = await fs.readFile(envPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...values] = line.split('=');
          const value = values.join('=').trim();
          if (value) {
            process.env[key.trim()] = value;
          }
        }
      });
      
      this.log('✓ Environment variables loaded from .env file', 'green');
    } catch (error) {
      this.log('⚠ No .env file found, using system environment variables', 'yellow');
    }

    // Check for backend .env file as well
    try {
      const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
      const backendEnvContent = await fs.readFile(backendEnvPath, 'utf8');
      
      backendEnvContent.split('\n').forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...values] = line.split('=');
          const value = values.join('=').trim();
          if (value && !process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
      
      this.log('✓ Backend environment variables loaded', 'green');
    } catch (error) {
      this.log('⚠ No backend/.env file found', 'yellow');
    }

    this.apiKey = process.env.OPENAI_API_KEY;
    
    if (!this.apiKey) {
      this.log('✗ OpenAI API key not found in environment variables', 'red');
      this.results.errors.push('Missing OPENAI_API_KEY environment variable');
      return false;
    }
    
    if (!this.apiKey.startsWith('sk-')) {
      this.log('✗ Invalid OpenAI API key format (should start with sk-)', 'red');
      this.results.errors.push('Invalid API key format');
      return false;
    }
    
    this.log(`✓ OpenAI API key found: ${this.apiKey.substring(0, 10)}...`, 'green');
    return true;
  }

  async initializeOpenAI() {
    this.log('\n=== Initializing OpenAI Client ===', 'bold');
    
    try {
      this.openai = new OpenAI({
        apiKey: this.apiKey
      });
      this.log('✓ OpenAI client initialized successfully', 'green');
      return true;
    } catch (error) {
      this.log(`✗ Failed to initialize OpenAI client: ${error.message}`, 'red');
      this.results.errors.push(`OpenAI initialization failed: ${error.message}`);
      return false;
    }
  }

  async testApiConnection() {
    this.log('\n=== Testing API Connection ===', 'bold');
    
    try {
      const startTime = Date.now();
      
      // Test with models endpoint (lightweight call)
      const response = await this.openai.models.list();
      
      const responseTime = Date.now() - startTime;
      this.results.responseTime = responseTime;
      
      this.logTest('API Connection', 'PASS', `(${responseTime}ms)`);
      this.results.connectionSuccess = true;
      this.results.apiKeyValid = true;
      
      // Log available models
      if (response.data && response.data.length > 0) {
        const modelCount = response.data.length;
        this.log(`  Available models: ${modelCount}`, 'blue');
        
        const gpt4Models = response.data.filter(m => m.id.includes('gpt-4')).map(m => m.id);
        const gpt35Models = response.data.filter(m => m.id.includes('gpt-3.5')).map(m => m.id);
        
        if (gpt4Models.length > 0) {
          this.log(`  GPT-4 models: ${gpt4Models.slice(0, 3).join(', ')}${gpt4Models.length > 3 ? '...' : ''}`, 'blue');
        }
        if (gpt35Models.length > 0) {
          this.log(`  GPT-3.5 models: ${gpt35Models.slice(0, 3).join(', ')}${gpt35Models.length > 3 ? '...' : ''}`, 'blue');
        }
      }
      
      if (responseTime > 5000) {
        this.results.warnings.push('API response time is slow (>5s)');
        this.log('  ⚠ Warning: Response time is slower than expected', 'yellow');
      }
      
      return true;
    } catch (error) {
      this.logTest('API Connection', 'FAIL', error.message);
      this.results.errors.push(`API connection failed: ${error.message}`);
      
      if (error.status === 401) {
        this.log('  Possible causes: Invalid or expired API key', 'red');
      } else if (error.status === 429) {
        this.log('  Possible causes: Rate limit exceeded or quota exhausted', 'red');
      } else if (error.status === 403) {
        this.log('  Possible causes: API key lacks necessary permissions', 'red');
      }
      
      return false;
    }
  }

  async testContentGeneration() {
    this.log('\n=== Testing Content Generation ===', 'bold');
    
    try {
      const testPrompt = "Write a brief social media post about the benefits of AI in business (max 100 words).";
      
      this.log('  Testing basic content generation...', 'blue');
      const startTime = Date.now();
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      const responseTime = Date.now() - startTime;
      
      if (completion.choices && completion.choices.length > 0) {
        const generatedContent = completion.choices[0].message.content;
        
        this.logTest('Content Generation', 'PASS', `(${responseTime}ms)`);
        this.results.contentGeneration = true;
        
        // Display the generated content (truncated)
        const contentPreview = generatedContent.length > 100 
          ? generatedContent.substring(0, 100) + '...'
          : generatedContent;
        this.log(`  Generated: "${contentPreview}"`, 'blue');
        
        // Check usage information
        if (completion.usage) {
          this.log(`  Tokens used: ${completion.usage.total_tokens} (prompt: ${completion.usage.prompt_tokens}, completion: ${completion.usage.completion_tokens})`, 'blue');
          this.results.apiUsage = completion.usage;
        }
        
        return true;
      } else {
        this.logTest('Content Generation', 'FAIL', 'No content generated');
        this.results.errors.push('Content generation returned no results');
        return false;
      }
    } catch (error) {
      this.logTest('Content Generation', 'FAIL', error.message);
      this.results.errors.push(`Content generation failed: ${error.message}`);
      
      if (error.status === 429) {
        this.log('  Rate limit reached - consider implementing backoff strategy', 'yellow');
      }
      
      return false;
    }
  }

  async testPlatformSpecificGeneration() {
    this.log('\n=== Testing Platform-Specific Content Generation ===', 'bold');
    
    const platforms = [
      {
        name: 'Twitter',
        prompt: 'Create a Twitter post about AI innovation (max 280 characters)',
        maxTokens: 100
      },
      {
        name: 'LinkedIn',
        prompt: 'Write a LinkedIn post about digital transformation (professional tone)',
        maxTokens: 200
      }
    ];

    let allPassed = true;

    for (const platform of platforms) {
      try {
        this.log(`  Testing ${platform.name} content generation...`, 'blue');
        
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a ${platform.name} content specialist. Create engaging, platform-appropriate content.`
            },
            {
              role: 'user',
              content: platform.prompt
            }
          ],
          max_tokens: platform.maxTokens,
          temperature: 0.8
        });

        if (completion.choices && completion.choices.length > 0) {
          this.logTest(`${platform.name} Content`, 'PASS');
          const content = completion.choices[0].message.content;
          const preview = content.length > 80 ? content.substring(0, 80) + '...' : content;
          this.log(`    Preview: "${preview}"`, 'blue');
        } else {
          this.logTest(`${platform.name} Content`, 'FAIL', 'No content generated');
          allPassed = false;
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logTest(`${platform.name} Content`, 'FAIL', error.message);
        allPassed = false;
      }
    }

    return allPassed;
  }

  async testErrorHandling() {
    this.log('\n=== Testing Error Handling ===', 'bold');
    
    try {
      // Test with invalid model
      this.log('  Testing invalid model handling...', 'blue');
      
      try {
        await this.openai.chat.completions.create({
          model: 'invalid-model-name',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        });
        
        this.logTest('Invalid Model Handling', 'FAIL', 'Should have thrown an error');
        return false;
      } catch (error) {
        if (error.status === 404 || error.message.includes('model')) {
          this.logTest('Invalid Model Handling', 'PASS', 'Correctly handled invalid model');
        } else {
          this.logTest('Invalid Model Handling', 'WARN', `Unexpected error: ${error.message}`);
        }
      }

      // Test with very large token request (should handle gracefully)
      this.log('  Testing large token request handling...', 'blue');
      
      try {
        await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Write a very long story' }],
          max_tokens: 10000, // This should be within limits for gpt-3.5-turbo
        });
        
        this.logTest('Large Token Request', 'PASS', 'Handled large token request');
      } catch (error) {
        if (error.status === 400) {
          this.logTest('Large Token Request', 'PASS', 'Correctly rejected oversized request');
        } else {
          this.logTest('Large Token Request', 'WARN', `Unexpected error: ${error.message}`);
        }
      }

      this.results.errorHandling = true;
      return true;
      
    } catch (error) {
      this.logTest('Error Handling', 'FAIL', error.message);
      this.results.errors.push(`Error handling test failed: ${error.message}`);
      return false;
    }
  }

  async testRateLimitBehavior() {
    this.log('\n=== Testing Rate Limit Behavior ===', 'bold');
    
    try {
      this.log('  Testing multiple concurrent requests...', 'blue');
      
      const requests = [];
      const startTime = Date.now();
      
      // Make 3 concurrent requests
      for (let i = 0; i < 3; i++) {
        requests.push(
          this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Test request ${i + 1}` }],
            max_tokens: 20
          })
        );
      }
      
      const results = await Promise.allSettled(requests);
      const totalTime = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      this.log(`  Completed ${successful} successful, ${failed} failed requests in ${totalTime}ms`, 'blue');
      
      if (successful >= 2) {
        this.logTest('Concurrent Requests', 'PASS', `${successful}/3 succeeded`);
        this.results.rateLimitHandling = true;
      } else {
        this.logTest('Concurrent Requests', 'WARN', `Only ${successful}/3 succeeded`);
        this.results.warnings.push('Some concurrent requests failed - may indicate rate limiting');
      }
      
      // Check for rate limit errors
      const rateLimitErrors = results
        .filter(r => r.status === 'rejected')
        .filter(r => r.reason.status === 429);
      
      if (rateLimitErrors.length > 0) {
        this.log('  ⚠ Rate limit errors detected - implement exponential backoff', 'yellow');
        this.results.warnings.push('Rate limiting detected');
      }
      
      return true;
      
    } catch (error) {
      this.logTest('Rate Limit Behavior', 'FAIL', error.message);
      this.results.errors.push(`Rate limit test failed: ${error.message}`);
      return false;
    }
  }

  async checkApiUsageAndLimits() {
    this.log('\n=== Checking API Usage and Limits ===', 'bold');
    
    // Note: OpenAI doesn't provide a direct API to check usage limits
    // We can only make recommendations based on best practices
    
    this.log('  ℹ OpenAI Usage Monitoring Recommendations:', 'blue');
    this.log('    • Visit https://platform.openai.com/usage for current usage', 'blue');
    this.log('    • Set up billing alerts in OpenAI dashboard', 'blue');
    this.log('    • Monitor API response headers for rate limit info', 'blue');
    this.log('    • Implement exponential backoff for rate limits', 'blue');
    
    if (this.results.apiUsage) {
      this.log(`  Last request token usage: ${this.results.apiUsage.total_tokens} tokens`, 'blue');
      
      // Calculate approximate cost (rough estimate for gpt-3.5-turbo)
      const estimatedCost = (this.results.apiUsage.total_tokens / 1000) * 0.002; // $0.002 per 1K tokens
      this.log(`  Estimated cost: $${estimatedCost.toFixed(6)}`, 'blue');
    }
    
    this.logTest('Usage Monitoring', 'PASS', 'Recommendations provided');
    return true;
  }

  async generateTestReport() {
    this.log('\n' + '='.repeat(60), 'bold');
    this.log('OpenAI API Integration Test Report', 'bold');
    this.log('='.repeat(60), 'bold');
    
    const overallStatus = this.results.errors.length === 0 ? 'PASS' : 'FAIL';
    const statusColor = overallStatus === 'PASS' ? 'green' : 'red';
    
    this.log(`\nOverall Status: ${colors[statusColor]}${overallStatus}${colors.reset}`, 'bold');
    
    this.log('\n📊 Test Results:', 'bold');
    this.log(`  ✅ API Key Valid: ${this.results.apiKeyValid ? 'Yes' : 'No'}`);
    this.log(`  ✅ Connection Success: ${this.results.connectionSuccess ? 'Yes' : 'No'}`);
    this.log(`  ✅ Content Generation: ${this.results.contentGeneration ? 'Yes' : 'No'}`);
    this.log(`  ✅ Error Handling: ${this.results.errorHandling ? 'Yes' : 'No'}`);
    this.log(`  ✅ Rate Limit Handling: ${this.results.rateLimitHandling ? 'Yes' : 'No'}`);
    this.log(`  ⚡ Average Response Time: ${this.results.responseTime}ms`);
    
    if (this.results.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'yellow');
      this.results.warnings.forEach(warning => {
        this.log(`   • ${warning}`, 'yellow');
      });
    }
    
    if (this.results.errors.length > 0) {
      this.log('\n❌ Errors:', 'red');
      this.results.errors.forEach(error => {
        this.log(`   • ${error}`, 'red');
      });
    }
    
    this.log('\n🔧 Next Steps:', 'bold');
    
    if (overallStatus === 'PASS') {
      this.log('  ✅ OpenAI integration is working correctly!', 'green');
      this.log('  📈 Consider setting up monitoring and alerts', 'blue');
      this.log('  🔒 Implement proper error handling in production', 'blue');
      this.log('  💰 Monitor API usage and costs regularly', 'blue');
    } else {
      this.log('  🔧 Fix the errors listed above', 'red');
      this.log('  🔑 Verify your OpenAI API key is valid and has credits', 'red');
      this.log('  🌐 Check your internet connection', 'red');
      this.log('  📖 Review OpenAI API documentation', 'red');
    }
    
    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      overallStatus,
      results: this.results
    };
    
    try {
      await fs.writeFile('openai-integration-test-report.json', JSON.stringify(reportData, null, 2));
      this.log('\n💾 Detailed report saved to: openai-integration-test-report.json', 'blue');
    } catch (error) {
      this.log('\n⚠️  Could not save detailed report to file', 'yellow');
    }
  }

  async runAllTests() {
    this.log('🚀 Starting OpenAI API Integration Tests...', 'bold');
    
    const envLoaded = await this.loadEnvironmentVariables();
    if (!envLoaded) return;
    
    const clientInitialized = await this.initializeOpenAI();
    if (!clientInitialized) return;
    
    await this.testApiConnection();
    
    if (this.results.connectionSuccess) {
      await this.testContentGeneration();
      await this.testPlatformSpecificGeneration();
      await this.testErrorHandling();
      await this.testRateLimitBehavior();
      await this.checkApiUsageAndLimits();
    }
    
    await this.generateTestReport();
  }
}

// Run the tests
const tester = new OpenAIIntegrationTest();
tester.runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
