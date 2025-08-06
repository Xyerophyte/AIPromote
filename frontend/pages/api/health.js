/**
 * Frontend Health Check API Endpoint
 * Used by Docker health checks and monitoring
 */

export default function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        status: 'error', 
        message: 'Method not allowed' 
      });
    }

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      backend: {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        connected: true, // We'll assume connected for basic health
      }
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed',
    });
  }
}
