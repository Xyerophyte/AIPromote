"use client"

interface PerformanceMetrics {
  fps: number
  frameDrops: number
  avgFrameTime: number
  timestamp: number
}

interface AnimationMonitorOptions {
  sampleDuration?: number // Duration in ms to collect samples
  performanceThreshold?: number // FPS threshold below which to suggest performance mode
  onPerformanceIssue?: (metrics: PerformanceMetrics) => void
}

/**
 * Animation Performance Monitor
 * Tracks FPS and frame drops during animations to optimize performance
 */
export class AnimationPerformanceMonitor {
  private static instance: AnimationPerformanceMonitor
  private isMonitoring = false
  private frameCount = 0
  private lastTimestamp = 0
  private frameTimes: number[] = []
  private frameDrops = 0
  private rafId: number | null = null
  private startTime = 0
  
  private options: Required<AnimationMonitorOptions> = {
    sampleDuration: 3000, // 3 seconds
    performanceThreshold: 45, // Below 45 FPS is considered poor performance
    onPerformanceIssue: () => {}
  }

  private constructor() {}

  static getInstance(): AnimationPerformanceMonitor {
    if (!AnimationPerformanceMonitor.instance) {
      AnimationPerformanceMonitor.instance = new AnimationPerformanceMonitor()
    }
    return AnimationPerformanceMonitor.instance
  }

  /**
   * Configure the animation monitor
   */
  configure(options: Partial<AnimationMonitorOptions> = {}) {
    this.options = { ...this.options, ...options }
  }

  /**
   * Start monitoring animation performance
   */
  startMonitoring() {
    if (this.isMonitoring || typeof window === "undefined" || !window.requestAnimationFrame) {
      return
    }

    this.isMonitoring = true
    this.frameCount = 0
    this.frameDrops = 0
    this.frameTimes = []
    this.startTime = performance.now()
    this.lastTimestamp = this.startTime
    
    this.monitorFrame()
  }

  /**
   * Stop monitoring and return metrics
   */
  stopMonitoring(): PerformanceMetrics | null {
    if (!this.isMonitoring) {
      return null
    }

    this.isMonitoring = false
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    const metrics = this.calculateMetrics()
    
    // Check if performance is below threshold
    if (metrics.fps < this.options.performanceThreshold) {
      this.options.onPerformanceIssue(metrics)
    }

    return metrics
  }

  /**
   * Get current performance metrics without stopping monitoring
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    if (!this.isMonitoring) {
      return null
    }

    return this.calculateMetrics()
  }

  /**
   * Check if device is likely to have performance issues with animations
   */
  static isLowPerformanceDevice(): boolean {
    if (typeof window === "undefined") return false

    // Check for indicators of low-performance devices
    const hardwareConcurrency = navigator.hardwareConcurrency || 1
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
    const isSlowConnection = (navigator as any).connection && 
      ((navigator as any).connection.effectiveType === 'slow-2g' || 
       (navigator as any).connection.effectiveType === '2g')

    return hardwareConcurrency <= 2 || isLowMemory || isSlowConnection || 
           (isMobile && hardwareConcurrency <= 4)
  }

  /**
   * Get recommended animation settings based on device performance
   */
  static getRecommendedSettings() {
    const isLowPerformance = this.isLowPerformanceDevice()
    
    return {
      shouldReduceAnimations: isLowPerformance,
      maxParticleCount: isLowPerformance ? 5 : 20,
      animationDuration: isLowPerformance ? 0.2 : 0.6,
      enableBlur: !isLowPerformance,
      enableShadows: !isLowPerformance,
      springConfig: isLowPerformance 
        ? { type: "tween", duration: 0.2 }
        : { type: "spring", stiffness: 300, damping: 20 }
    }
  }

  private monitorFrame = () => {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    const frameTime = currentTime - this.lastTimestamp
    
    this.frameCount++
    this.frameTimes.push(frameTime)
    
    // Detect frame drops (frames taking longer than ~16.67ms for 60fps)
    if (frameTime > 20) {
      this.frameDrops++
    }

    this.lastTimestamp = currentTime

    // Continue monitoring if within sample duration
    if (currentTime - this.startTime < this.options.sampleDuration) {
      this.rafId = requestAnimationFrame(this.monitorFrame)
    } else {
      // Auto-stop after sample duration
      this.stopMonitoring()
    }
  }

  private calculateMetrics(): PerformanceMetrics {
    const totalTime = this.lastTimestamp - this.startTime
    const fps = Math.round((this.frameCount * 1000) / totalTime)
    
    const avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length

    return {
      fps,
      frameDrops: this.frameDrops,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      timestamp: Date.now()
    }
  }
}

/**
 * Hook to use animation performance monitoring
 */
export function useAnimationPerformanceMonitor() {
  const monitor = AnimationPerformanceMonitor.getInstance()

  React.useEffect(() => {
    return () => {
      monitor.stopMonitoring()
    }
  }, [monitor])

  return {
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
    getCurrentMetrics: () => monitor.getCurrentMetrics(),
    isLowPerformanceDevice: AnimationPerformanceMonitor.isLowPerformanceDevice(),
    recommendedSettings: AnimationPerformanceMonitor.getRecommendedSettings()
  }
}

import React from "react"
