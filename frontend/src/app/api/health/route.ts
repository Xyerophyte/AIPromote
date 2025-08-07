import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { kv } from '@vercel/kv'

const prisma = new PrismaClient()

// Helper function to check KV health
async function checkKVHealth(): Promise<boolean> {
  try {
    const testKey = `health-check-${Date.now()}`
    await kv.set(testKey, 'test', { ex: 60 })
    const result = await kv.get(testKey)
    await kv.del(testKey)
    return result === 'test'
  } catch (error) {
    console.error('KV health check failed:', error)
    return false
  }
}

// Helper function to check database health
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  // Run health checks in parallel
  const [kvHealth, dbHealth] = await Promise.allSettled([
    checkKVHealth(),
    checkDatabaseHealth()
  ])
  
  const kvStatus = kvHealth.status === 'fulfilled' && kvHealth.value
  const dbStatus = dbHealth.status === 'fulfilled' && dbHealth.value
  const overallHealthy = kvStatus && dbStatus
  
  return NextResponse.json({
    status: overallHealthy ? 'healthy' : 'degraded',
    timestamp,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus ? 'connected' : 'disconnected',
      cache: kvStatus ? 'connected' : 'disconnected',
    },
    uptime: process.uptime()
  }, { status: overallHealthy ? 200 : 503 })
}
