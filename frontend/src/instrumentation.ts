export async function register() {
  // Temporarily disabled to fix server startup
  // TODO: Configure Sentry properly when ready
  console.log('Instrumentation hook registered - Sentry disabled for now')
  
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   // Server-side instrumentation
  //   const { Sentry } = await import('@sentry/nextjs')
  //   
  //   Sentry.init({
  //     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //     tracesSampleRate: 1.0,
  //     debug: process.env.NODE_ENV === 'development',
  //   })
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   // Edge runtime instrumentation
  //   const { Sentry } = await import('@sentry/nextjs')
  //   
  //   Sentry.init({
  //     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //     tracesSampleRate: 1.0,
  //     debug: process.env.NODE_ENV === 'development',
  //   })
  // }
}
