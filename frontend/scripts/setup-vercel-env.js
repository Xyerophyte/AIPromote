#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Environment variables to set up
const ENV_VARIABLES = [
  // Next.js & Auth
  {
    name: 'NEXTAUTH_URL',
    description: 'Your production URL',
    required: true,
    environments: ['production', 'preview'],
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'NextAuth secret key',
    required: true,
    environments: ['production', 'preview', 'development'],
  },

  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
    environments: ['production', 'preview', 'development'],
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    required: true,
    environments: ['production', 'preview', 'development'],
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key',
    required: true,
    environments: ['production', 'preview'],
  },

  // Database
  {
    name: 'DATABASE_URL',
    description: 'Database connection string',
    required: true,
    environments: ['production', 'preview'],
  },

  // OpenAI
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key',
    required: true,
    environments: ['production', 'preview', 'development'],
  },

  // Email (Resend)
  {
    name: 'RESEND_API_KEY',
    description: 'Resend API key for emails',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'FROM_EMAIL',
    description: 'From email address',
    required: false,
    environments: ['production', 'preview'],
  },

  // Vercel KV
  {
    name: 'KV_URL',
    description: 'Vercel KV URL',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'KV_REST_API_URL',
    description: 'Vercel KV REST API URL',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'KV_REST_API_TOKEN',
    description: 'Vercel KV REST API Token',
    required: false,
    environments: ['production', 'preview'],
  },

  // Vercel Blob
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    description: 'Vercel Blob read/write token',
    required: false,
    environments: ['production', 'preview'],
  },

  // Stripe
  {
    name: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    description: 'Stripe webhook secret',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'STRIPE_STARTER_PRICE_ID',
    description: 'Stripe price ID for Starter plan',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'STRIPE_PRO_PRICE_ID',
    description: 'Stripe price ID for Pro plan',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'STRIPE_ENTERPRISE_PRICE_ID',
    description: 'Stripe price ID for Enterprise plan',
    required: false,
    environments: ['production', 'preview'],
  },

  // OAuth Providers
  {
    name: 'GOOGLE_CLIENT_ID',
    description: 'Google OAuth client ID',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    description: 'Google OAuth client secret',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'GITHUB_CLIENT_ID',
    description: 'GitHub OAuth client ID',
    required: false,
    environments: ['production', 'preview'],
  },
  {
    name: 'GITHUB_CLIENT_SECRET',
    description: 'GitHub OAuth client secret',
    required: false,
    environments: ['production', 'preview'],
  },

  // Analytics & Monitoring
  {
    name: 'NEXT_PUBLIC_VERCEL_ANALYTICS',
    description: 'Enable Vercel Analytics',
    required: false,
    environments: ['production', 'preview'],
    defaultValue: '1',
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    description: 'Sentry DSN for error tracking',
    required: false,
    environments: ['production', 'preview'],
  },
]

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' })
  } catch (error) {
    return null
  }
}

function checkVercelCLI() {
  const version = runCommand('vercel --version')
  if (!version) {
    console.error('❌ Vercel CLI is not installed or not in PATH')
    console.log('Please install it with: npm i -g vercel')
    process.exit(1)
  }
  console.log('✅ Vercel CLI found:', version.trim())
}

function checkVercelAuth() {
  const whoami = runCommand('vercel whoami')
  if (!whoami) {
    console.error('❌ Not logged in to Vercel')
    console.log('Please run: vercel login')
    process.exit(1)
  }
  console.log('✅ Logged in to Vercel as:', whoami.trim())
}

function getCurrentProject() {
  try {
    const vercelConfig = fs.readFileSync('.vercel/project.json', 'utf8')
    const config = JSON.parse(vercelConfig)
    return config
  } catch (error) {
    console.error('❌ No Vercel project found')
    console.log('Please run: vercel link')
    process.exit(1)
  }
}

function getCurrentEnvVars() {
  const result = runCommand('vercel env ls')
  if (!result) {
    return []
  }
  
  // Parse the output to get existing environment variable names
  const lines = result.split('\n')
  const envVars = []
  
  for (const line of lines) {
    if (line.includes('│') && !line.includes('Name')) {
      const parts = line.split('│').map(part => part.trim())
      if (parts.length >= 2 && parts[1]) {
        envVars.push(parts[1])
      }
    }
  }
  
  return envVars
}

function setEnvironmentVariable(name, value, environments) {
  const envFlags = environments.map(env => `-e ${env}`).join(' ')
  const command = `vercel env add ${name} ${envFlags}`
  
  console.log(`Setting ${name} for environments: ${environments.join(', ')}`)
  
  try {
    // Use spawn for interactive input if needed
    const { spawn } = require('child_process')
    const child = spawn('vercel', ['env', 'add', name, ...environments.flatMap(e => ['-e', e])], {
      stdio: 'inherit'
    })
    
    return new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed with code ${code}`))
        }
      })
    })
  } catch (error) {
    console.error(`❌ Failed to set ${name}:`, error.message)
    return false
  }
}

async function setupEnvironmentVariables() {
  console.log('\n📝 Setting up environment variables...\n')
  
  const existingVars = getCurrentEnvVars()
  
  for (const envVar of ENV_VARIABLES) {
    if (existingVars.includes(envVar.name)) {
      console.log(`⏭️  ${envVar.name} already exists, skipping...`)
      continue
    }
    
    console.log(`\n🔧 Setting up: ${envVar.name}`)
    console.log(`Description: ${envVar.description}`)
    console.log(`Environments: ${envVar.environments.join(', ')}`)
    console.log(`Required: ${envVar.required ? 'Yes' : 'No'}`)
    
    if (envVar.required) {
      console.log('⚠️  This variable is required for the application to work properly.')
    }
    
    try {
      await setEnvironmentVariable(envVar.name, '', envVar.environments)
      console.log(`✅ Successfully set ${envVar.name}`)
    } catch (error) {
      console.error(`❌ Failed to set ${envVar.name}:`, error.message)
      if (envVar.required) {
        console.log('⚠️  This is a required variable. The application may not work without it.')
      }
    }
  }
}

function generateEnvTemplate() {
  const templatePath = '.env.production.template'
  let template = `# Production Environment Variables Template
# Copy this file to .env.production and fill in your values
# Run 'vercel env pull' to sync environment variables locally

`

  for (const envVar of ENV_VARIABLES) {
    template += `# ${envVar.description}\n`
    template += `# Required: ${envVar.required ? 'Yes' : 'No'}\n`
    template += `# Environments: ${envVar.environments.join(', ')}\n`
    template += `${envVar.name}=${envVar.defaultValue || ''}\n\n`
  }

  fs.writeFileSync(templatePath, template)
  console.log(`✅ Generated environment template: ${templatePath}`)
}

async function main() {
  console.log('🚀 Setting up Vercel External Services Configuration\n')
  
  // Pre-flight checks
  checkVercelCLI()
  checkVercelAuth()
  const project = getCurrentProject()
  console.log(`✅ Using Vercel project: ${project.name} (${project.projectId})`)
  
  // Generate template
  generateEnvTemplate()
  
  // Interactive setup
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  console.log('\nThis script will help you set up environment variables for external services.')
  console.log('You can set them interactively now, or use the Vercel dashboard later.\n')
  
  const answer = await new Promise(resolve => {
    readline.question('Do you want to set up environment variables interactively? (y/N): ', resolve)
  })
  
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    await setupEnvironmentVariables()
  } else {
    console.log('\n📋 Environment variables can be set later using:')
    console.log('• Vercel Dashboard: https://vercel.com/dashboard')
    console.log('• Vercel CLI: vercel env add <name>')
    console.log('• Use the generated .env.production.template as reference')
  }
  
  console.log('\n✨ Setup complete!')
  console.log('\nNext steps:')
  console.log('1. Set up your external service accounts (OpenAI, Stripe, etc.)')
  console.log('2. Add the API keys to Vercel environment variables')
  console.log('3. Configure your services in their respective dashboards')
  console.log('4. Deploy your application: vercel --prod')
  
  readline.close()
}

if (require.main === module) {
  main().catch(console.error)
}
