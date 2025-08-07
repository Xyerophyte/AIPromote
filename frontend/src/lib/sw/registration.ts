interface ServiceWorkerManager {
  register: () => Promise<ServiceWorkerRegistration | null>
  unregister: () => Promise<boolean>
  update: () => Promise<void>
  clearCache: () => Promise<void>
  warmCache: (urls: string[]) => Promise<void>
  getRegistration: () => Promise<ServiceWorkerRegistration | null>
}

class ServiceWorkerManager implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('🚫 Service Worker: Not supported in this environment')
      return null
    }

    try {
      console.log('🔧 Service Worker: Registering...')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      this.registration = registration

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          console.log('🔄 Service Worker: New version found')
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Service Worker: New version ready')
              
              // Notify user about update
              this.notifyUpdate()
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event)
      })

      // Check for updates periodically
      setInterval(() => {
        this.checkForUpdates()
      }, 60000) // Check every minute

      console.log('✅ Service Worker: Registered successfully')
      return registration
      
    } catch (error) {
      console.error('❌ Service Worker: Registration failed:', error)
      return null
    }
  }

  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      
      for (const registration of registrations) {
        await registration.unregister()
      }
      
      console.log('🗑️  Service Worker: Unregistered successfully')
      return true
    } catch (error) {
      console.error('❌ Service Worker: Unregistration failed:', error)
      return false
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      console.log('⚠️  Service Worker: No registration found for update')
      return
    }

    try {
      await this.registration.update()
      console.log('🔄 Service Worker: Update check completed')
    } catch (error) {
      console.error('❌ Service Worker: Update failed:', error)
    }
  }

  async clearCache(): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      console.log('⚠️  Service Worker: No active service worker for cache clearing')
      return
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE'
    })

    console.log('🗑️  Service Worker: Cache clear requested')
  }

  async warmCache(urls: string[]): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      console.log('⚠️  Service Worker: No active service worker for cache warming')
      return
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'WARM_CACHE',
      urls
    })

    console.log('🔥 Service Worker: Cache warming requested for:', urls)
  }

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    try {
      return await navigator.serviceWorker.getRegistration()
    } catch (error) {
      console.error('❌ Service Worker: Failed to get registration:', error)
      return null
    }
  }

  private async checkForUpdates(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
    } catch (error) {
      // Silently fail - this is just a background check
      console.log('Service Worker: Background update check failed')
    }
  }

  private handleMessage(event: MessageEvent): void {
    const { data } = event
    
    if (!data || typeof data !== 'object') return

    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('📦 Service Worker: Cache was updated')
        // Optionally notify the user or refresh data
        break
        
      case 'OFFLINE':
        console.log('📴 Service Worker: App is offline')
        // Handle offline state
        this.handleOffline()
        break
        
      case 'ONLINE':
        console.log('🌐 Service Worker: App is online')
        // Handle online state
        this.handleOnline()
        break
        
      default:
        console.log('📨 Service Worker: Received message:', data)
    }
  }

  private notifyUpdate(): void {
    // Check if user wants to be notified about updates
    const shouldNotify = localStorage.getItem('sw-update-notifications') !== 'false'
    
    if (shouldNotify) {
      // You can show a toast notification or modal here
      const updateAvailable = confirm(
        'A new version of AI Promote is available. Would you like to update now?'
      )
      
      if (updateAvailable) {
        this.skipWaiting()
      }
    }
  }

  private skipWaiting(): void {
    if (!navigator.serviceWorker.controller) return

    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING'
    })

    // Reload the page to get the new version
    window.location.reload()
  }

  private handleOffline(): void {
    // Add offline indicator to UI
    const offlineIndicator = document.createElement('div')
    offlineIndicator.id = 'offline-indicator'
    offlineIndicator.innerHTML = '📴 Offline mode'
    offlineIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff6b6b;
      color: white;
      padding: 8px;
      text-align: center;
      z-index: 9999;
      font-size: 14px;
    `
    
    if (!document.getElementById('offline-indicator')) {
      document.body.appendChild(offlineIndicator)
    }
  }

  private handleOnline(): void {
    // Remove offline indicator
    const indicator = document.getElementById('offline-indicator')
    if (indicator) {
      indicator.remove()
    }
  }
}

// Singleton instance
export const swManager = new ServiceWorkerManager()

// Utility functions for easy access
export async function registerServiceWorker(): Promise<boolean> {
  const registration = await swManager.register()
  return registration !== null
}

export async function unregisterServiceWorker(): Promise<boolean> {
  return await swManager.unregister()
}

export async function updateServiceWorker(): Promise<void> {
  return await swManager.update()
}

export async function clearServiceWorkerCache(): Promise<void> {
  return await swManager.clearCache()
}

export async function warmServiceWorkerCache(urls: string[]): Promise<void> {
  return await swManager.warmCache(urls)
}

// Auto-registration helper
export function autoRegisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  
  // Register on load
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', async () => {
        const success = await registerServiceWorker()
        resolve(success)
      })
    })
  } else {
    return registerServiceWorker()
  }
}

// Cache warming for important routes
export async function warmImportantRoutes(): Promise<void> {
  const importantUrls = [
    '/',
    '/dashboard',
    '/intake',
    '/api/startups',
    '/api/health'
  ]
  
  await warmServiceWorkerCache(importantUrls)
}

export default swManager
