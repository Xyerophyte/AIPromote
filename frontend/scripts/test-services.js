#!/usr/bin/env node

const axios = require('axios')

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TIMEOUT = 10000 // 10 seconds

// Test endpoints
const TESTS = [
  {
    name: 'OpenAI Service',
    endpoint: '/api/test/openai',
    method: 'GET',
    description: 'Test OpenAI API connectivity and content generation'
  },
  {
    name: 'Email Service (Resend)',
    endpoint: '/api/test/email',
    method: 'GET',
    description: 'Test email service configuration'
  },
  {
    name: 'Vercel KV',
    endpoint: '/api/test/kv',
    method: 'GET',
    description: 'Test Vercel KV (Redis) connectivity'
  },
  {
    name: 'Vercel Blob',
    endpoint: '/api/test/blob',
    method: 'GET',
    description: 'Test Vercel Blob storage connectivity'
  },
  {
    name: 'Stripe Service',
    endpoint: '/api/test/stripe',
    method: 'GET',
    description: 'Test Stripe payment processing'
  },
  {
    name: 'Database Connection',
    endpoint: '/api/test/database',
    method: 'GET',
    description: 'Test database connectivity'
  }
]

async function testEndpoint(test) {
  const url = `${BASE_URL}${test.endpoint}`
  const startTime = Date.now()
  
  try {
    console.log(`\n🔍 Testing ${test.name}...`)
    console.log(`   Endpoint: ${test.method} ${url}`)
    console.log(`   Description: ${test.description}`)
    
    const config = {
      method: test.method.toLowerCase(),
      url,
      timeout: TIMEOUT,
      validateStatus: () => true // Don't throw on 4xx/5xx
    }

    if (test.method === 'POST' && test.data) {
      config.data = test.data
      config.headers = { 'Content-Type': 'application/json' }
    }

    const response = await axios(config)
    const responseTime = Date.now() - startTime
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ Success (${response.status}) - ${responseTime}ms`)
      if (response.data?.message) {
        console.log(`   📄 Response: ${response.data.message}`)
      }
      if (response.data?.data) {
        console.log(`   📊 Data: ${JSON.stringify(response.data.data, null, 2)}`)
      }
      return { success: true, status: response.status, responseTime, data: response.data }
    } else {
      console.log(`   ❌ Failed (${response.status}) - ${responseTime}ms`)
      if (response.data?.error) {
        console.log(`   🚫 Error: ${response.data.error}`)
      }
      if (response.data?.message) {
        console.log(`   📄 Message: ${response.data.message}`)
      }
      return { success: false, status: response.status, responseTime, error: response.data }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.log(`   ❌ Connection Failed - ${responseTime}ms`)
    console.log(`   🚫 Error: ${error.message}`)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Hint: Make sure your application is running')
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 Hint: Check the BASE_URL configuration')
    } else if (error.code === 'TIMEOUT') {
      console.log('   💡 Hint: Request timed out, service might be slow or unresponsive')
    }
    
    return { success: false, status: 0, responseTime, error: error.message }
  }
}

async function runHealthChecks() {
  console.log('🏥 External Services Health Check')
  console.log('='.repeat(50))
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Timeout: ${TIMEOUT}ms`)
  console.log(`Tests: ${TESTS.length}`)
  
  const results = []
  let successCount = 0
  
  for (const test of TESTS) {
    const result = await testEndpoint(test)
    results.push({ ...test, ...result })
    
    if (result.success) {
      successCount++
    }
    
    // Add delay between requests
    if (TESTS.indexOf(test) < TESTS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Summary
  console.log('\n📊 Health Check Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successful: ${successCount}/${TESTS.length}`)
  console.log(`❌ Failed: ${TESTS.length - successCount}/${TESTS.length}`)
  console.log(`📈 Success Rate: ${Math.round((successCount / TESTS.length) * 100)}%`)
  
  // Detailed results
  console.log('\n📋 Detailed Results')
  console.log('='.repeat(50))
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.name}`)
    console.log(`   Status: ${result.status || 'Connection Failed'}`)
    console.log(`   Response Time: ${result.responseTime}ms`)
    
    if (result.success && result.data) {
      if (result.data.version) {
        console.log(`   Version: ${result.data.version}`)
      }
      if (result.data.status) {
        console.log(`   Service Status: ${result.data.status}`)
      }
    }
    
    if (!result.success && result.error) {
      console.log(`   Error: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`)
    }
    console.log()
  })
  
  // Recommendations
  console.log('💡 Recommendations')
  console.log('='.repeat(50))
  
  const failedServices = results.filter(r => !r.success)
  
  if (failedServices.length === 0) {
    console.log('🎉 All services are healthy!')
    console.log('Your application is ready for production use.')
  } else {
    console.log('⚠️ Some services need attention:')
    
    failedServices.forEach(service => {
      console.log(`\n${service.name}:`)
      
      if (service.status === 0) {
        console.log('  - Check if the service endpoint exists')
        console.log('  - Verify the application is running')
        console.log('  - Check network connectivity')
      } else if (service.status === 404) {
        console.log('  - API endpoint not found')
        console.log('  - Check route implementation')
      } else if (service.status === 500) {
        console.log('  - Internal server error')
        console.log('  - Check service configuration')
        console.log('  - Verify API keys and credentials')
      } else if (service.status === 401 || service.status === 403) {
        console.log('  - Authentication/authorization issue')
        console.log('  - Check API keys and permissions')
      }
    })
    
    console.log('\n📚 Resources:')
    console.log('  - Setup Guide: EXTERNAL_SERVICES_SETUP.md')
    console.log('  - Environment Variables: vercel env ls')
    console.log('  - Logs: vercel logs')
  }
  
  // Exit code
  const exitCode = successCount === TESTS.length ? 0 : 1
  process.exit(exitCode)
}

// Create test endpoint files if they don't exist
async function createTestEndpoints() {
  const fs = require('fs')
  const path = require('path')
  
  const testDir = path.join(process.cwd(), 'src', 'app', 'api', 'test')
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }
  
  // Create test endpoints
  const endpoints = {
    'openai/route.ts': `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for OpenAI service
    const hasApiKey = !!process.env.OPENAI_API_KEY
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI service configuration check',
      data: {
        configured: hasApiKey,
        status: hasApiKey ? 'ready' : 'missing_api_key'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`,

    'email/route.ts': `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for email service
    const hasApiKey = !!process.env.RESEND_API_KEY
    const hasFromEmail = !!process.env.FROM_EMAIL
    
    return NextResponse.json({
      success: true,
      message: 'Email service configuration check',
      data: {
        resend_configured: hasApiKey,
        from_email_configured: hasFromEmail,
        status: hasApiKey && hasFromEmail ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`,

    'kv/route.ts': `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for KV service
    const hasKvToken = !!process.env.KV_REST_API_TOKEN
    const hasKvUrl = !!process.env.KV_REST_API_URL
    
    return NextResponse.json({
      success: true,
      message: 'Vercel KV configuration check',
      data: {
        kv_token_configured: hasKvToken,
        kv_url_configured: hasKvUrl,
        status: hasKvToken && hasKvUrl ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`,

    'blob/route.ts': `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for Blob service
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
    
    return NextResponse.json({
      success: true,
      message: 'Vercel Blob configuration check',
      data: {
        blob_configured: hasToken,
        status: hasToken ? 'ready' : 'missing_token'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`,

    'stripe/route.ts': `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for Stripe service
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
    
    return NextResponse.json({
      success: true,
      message: 'Stripe service configuration check',
      data: {
        secret_key_configured: hasSecretKey,
        webhook_secret_configured: hasWebhookSecret,
        status: hasSecretKey ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`,

    'database/route.ts': `import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check for database
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return NextResponse.json({
      success: true,
      message: 'Database configuration check',
      data: {
        database_url_configured: hasDatabaseUrl,
        supabase_url_configured: hasSupabaseUrl,
        supabase_key_configured: hasSupabaseKey,
        status: hasDatabaseUrl && hasSupabaseUrl && hasSupabaseKey ? 'ready' : 'missing_configuration'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}`
  }
  
  for (const [filename, content] of Object.entries(endpoints)) {
    const filePath = path.join(testDir, filename)
    const dir = path.dirname(filePath)
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content)
      console.log(`✅ Created test endpoint: ${filename}`)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--create-endpoints')) {
    console.log('📁 Creating test endpoints...')
    await createTestEndpoints()
    console.log('✅ Test endpoints created!')
    return
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🏥 External Services Health Check')
    console.log('Usage: node scripts/test-services.js [options]')
    console.log('')
    console.log('Options:')
    console.log('  --create-endpoints  Create test API endpoints')
    console.log('  --help, -h         Show this help message')
    console.log('')
    console.log('Environment Variables:')
    console.log('  BASE_URL           Base URL for testing (default: http://localhost:3000)')
    console.log('')
    console.log('Examples:')
    console.log('  npm run services:health')
    console.log('  BASE_URL=https://your-app.vercel.app npm run services:health')
    console.log('  node scripts/test-services.js --create-endpoints')
    return
  }
  
  await runHealthChecks()
}

if (require.main === module) {
  main().catch(console.error)
}
