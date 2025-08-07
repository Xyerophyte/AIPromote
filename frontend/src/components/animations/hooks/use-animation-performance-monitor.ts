'use client'

import { useState, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  fps: number
  frameDrops: number
  averageFrameTime: number
  isMonitoring: boolean
}

interface DeviceCapabilities {
  cores: number
  memory: number
  connection: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

interface RecommendedSettings {
  maxFps: number
  animationDuration: number
  particleCount: number
  enableBlur: boolean
  enableShadows: boolean
}

/**
 * Hook for monitoring animation performance and providing device-optimized settings
 */
export function useAnimationPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameDrops: 0,
    averageFrameTime: 16.67,
    isMonitoring: false
  })

  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  const measureFrame = useCallback(() => {
    const now = performance.now()
    
    if (lastFrameTimeRef.current) {
      const frameTime = now - lastFrameTimeRef.current
      frameTimesRef.current.push(frameTime)
      
      // Keep only last 60 frames for moving average
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift()
      }
      
      // Calculate metrics
      const averageFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
      const fps = 1000 / averageFrameTime
      const frameDrops = frameTimesRef.current.filter(time => time > 20).length // Frames taking more than 20ms
      
      setMetrics({
        fps: Math.round(fps * 10) / 10,
        frameDrops,
        averageFrameTime: Math.round(averageFrameTime * 100) / 100,
        isMonitoring: true
      })
    }
    
    lastFrameTimeRef.current = now
    
    if (metrics.isMonitoring) {
      animationFrameRef.current = requestAnimationFrame(measureFrame)
    }
  }, [metrics.isMonitoring])

  const startMonitoring = useCallback(() => {
    frameTimesRef.current = []
    startTimeRef.current = performance.now()
    setMetrics(prev => ({ ...prev, isMonitoring: true }))
    animationFrameRef.current = requestAnimationFrame(measureFrame)
  }, [measureFrame])

  const stopMonitoring = useCallback(() => {
    setMetrics(prev => ({ ...prev, isMonitoring: false }))
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const getCurrentMetrics = useCallback((): PerformanceMetrics => {
    return metrics
  }, [metrics])

  const getDeviceCapabilities = useCallback((): DeviceCapabilities => {
    // @ts-ignore - navigator properties may not be available in all browsers
    const cores = navigator.hardwareConcurrency || 4
    // @ts-ignore
    const memory = navigator.deviceMemory || 4
    // @ts-ignore
    const connection = navigator.connection?.effectiveType || '4g'
    
    // Simple device type detection
    const deviceType: 'mobile' | 'tablet' | 'desktop' = 
      /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' :
      /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' :
      'desktop'

    return {
      cores,
      memory,
      connection,
      deviceType
    }
  }, [])

  const isLowPerformanceDevice = useCallback((): boolean => {
    const capabilities = getDeviceCapabilities()
    const currentFps = metrics.fps
    
    return (
      capabilities.cores < 4 ||
      capabilities.memory < 4 ||
      capabilities.connection === '2g' ||
      capabilities.connection === '3g' ||
      capabilities.deviceType === 'mobile' ||
      currentFps < 45
    )
  }, [metrics.fps, getDeviceCapabilities])

  const getRecommendedSettings = useCallback((): RecommendedSettings => {
    const isLowPerf = isLowPerformanceDevice()
    const capabilities = getDeviceCapabilities()
    
    if (isLowPerf) {
      return {
        maxFps: 30,
        animationDuration: 200,
        particleCount: 5,
        enableBlur: false,
        enableShadows: false
      }
    }
    
    if (capabilities.deviceType === 'mobile') {
      return {
        maxFps: 45,
        animationDuration: 300,
        particleCount: 10,
        enableBlur: true,
        enableShadows: false
      }
    }
    
    return {
      maxFps: 60,
      animationDuration: 400,
      particleCount: 15,
      enableBlur: true,
      enableShadows: true
    }
  }, [isLowPerformanceDevice, getDeviceCapabilities])

  return {
    startMonitoring,
    stopMonitoring,
    getCurrentMetrics,
    getDeviceCapabilities,
    isLowPerformanceDevice,
    recommendedSettings: getRecommendedSettings()
  }
}
