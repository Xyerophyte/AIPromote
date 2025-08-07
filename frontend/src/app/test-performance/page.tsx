"use client"

import React, { useState, useEffect } from "react"
import { FadeIn, SlideIn, AnimatedCard, FloatingParticles } from "@/components/animations"
import { AnimatedButton } from "@/components/ui/animated-button"
import { useAnimationPerformanceMonitor } from "@/lib/performance/animation-monitor"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useLazyAnimation } from "@/hooks/useLazyAnimation"

export default function TestPerformancePage() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const prefersReducedMotion = useReducedMotion()
  
  const {
    startMonitoring,
    stopMonitoring,
    getCurrentMetrics,
    isLowPerformanceDevice,
    recommendedSettings
  } = useAnimationPerformanceMonitor()

  const { ref: lazyRef, shouldAnimate, isVisible } = useLazyAnimation({
    threshold: 0.2,
    triggerOnce: true
  })

  const handleStartMonitoring = () => {
    setIsMonitoring(true)
    startMonitoring()
    
    // Check metrics after 3 seconds
    setTimeout(() => {
      const currentMetrics = stopMonitoring()
      setMetrics(currentMetrics)
      setIsMonitoring(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <FadeIn>
          <h1 className="text-4xl font-bold text-center mb-2">
            Animation Performance Test
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Testing accessibility and performance optimizations
          </p>
        </FadeIn>

        {/* Performance Metrics Panel */}
        <AnimatedCard className="mb-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <h3 className="font-semibold">User Preferences</h3>
              <p className="text-sm">
                <span className="font-medium">Reduced Motion:</span>{" "}
                <span className={prefersReducedMotion ? "text-orange-600" : "text-green-600"}>
                  {prefersReducedMotion ? "Yes" : "No"}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Low Performance Device:</span>{" "}
                <span className={isLowPerformanceDevice ? "text-orange-600" : "text-green-600"}>
                  {isLowPerformanceDevice ? "Yes" : "No"}
                </span>
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Recommended Settings</h3>
              <p className="text-sm">
                <span className="font-medium">Max Particles:</span> {recommendedSettings.maxParticleCount}
              </p>
              <p className="text-sm">
                <span className="font-medium">Animation Duration:</span> {recommendedSettings.animationDuration}s
              </p>
              <p className="text-sm">
                <span className="font-medium">Enable Blur:</span>{" "}
                <span className={recommendedSettings.enableBlur ? "text-green-600" : "text-red-600"}>
                  {recommendedSettings.enableBlur ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <AnimatedButton
              onClick={handleStartMonitoring}
              disabled={isMonitoring}
              variant="primary"
            >
              {isMonitoring ? "Monitoring..." : "Test Performance"}
            </AnimatedButton>
          </div>

          {metrics && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Latest Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">FPS:</span>
                  <div className={`text-lg font-bold ${
                    metrics.fps >= 45 ? "text-green-600" : 
                    metrics.fps >= 30 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {metrics.fps}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Frame Drops:</span>
                  <div className={`text-lg font-bold ${
                    metrics.frameDrops <= 5 ? "text-green-600" : 
                    metrics.frameDrops <= 15 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {metrics.frameDrops}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Avg Frame Time:</span>
                  <div className="text-lg font-bold">
                    {metrics.avgFrameTime}ms
                  </div>
                </div>
                <div>
                  <span className="font-medium">Performance:</span>
                  <div className={`text-lg font-bold ${
                    metrics.fps >= 45 ? "text-green-600" : "text-red-600"
                  }`}>
                    {metrics.fps >= 45 ? "Good" : "Poor"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* Animation Test Components */}
        <div className="space-y-8">
          {/* Fade In Tests */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Fade In Animations</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <FadeIn direction="up" delay={0}>
                <AnimatedCard className="p-6">
                  <h3 className="font-semibold mb-2">Fade Up</h3>
                  <p className="text-sm text-gray-600">
                    This card fades in from bottom with will-change optimization
                  </p>
                </AnimatedCard>
              </FadeIn>
              
              <FadeIn direction="left" delay={0.1}>
                <AnimatedCard className="p-6">
                  <h3 className="font-semibold mb-2">Fade Left</h3>
                  <p className="text-sm text-gray-600">
                    Respects user's motion preferences
                  </p>
                </AnimatedCard>
              </FadeIn>
              
              <FadeIn direction="right" delay={0.2}>
                <AnimatedCard className="p-6">
                  <h3 className="font-semibold mb-2">Fade Right</h3>
                  <p className="text-sm text-gray-600">
                    Uses CSS transforms instead of position
                  </p>
                </AnimatedCard>
              </FadeIn>
            </div>
          </section>

          {/* Slide In Tests */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Slide In Animations</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <SlideIn direction="left" distance={100} delay={0}>
                <AnimatedCard className="p-6" glowEffect>
                  <h3 className="font-semibold mb-2">Slide From Left</h3>
                  <p className="text-sm text-gray-600">
                    Optimized slide animation with performance monitoring
                  </p>
                </AnimatedCard>
              </SlideIn>
              
              <SlideIn direction="right" distance={100} delay={0.1}>
                <AnimatedCard className="p-6" hoverScale={1.05}>
                  <h3 className="font-semibold mb-2">Slide From Right</h3>
                  <p className="text-sm text-gray-600">
                    Hover effects disabled for reduced motion users
                  </p>
                </AnimatedCard>
              </SlideIn>
            </div>
          </section>

          {/* Button Tests */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Interactive Elements</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <AnimatedButton variant="primary">
                Primary Button
              </AnimatedButton>
              <AnimatedButton variant="secondary">
                Secondary
              </AnimatedButton>
              <AnimatedButton variant="outline">
                Outline
              </AnimatedButton>
              <AnimatedButton variant="ghost">
                Ghost
              </AnimatedButton>
            </div>
          </section>

          {/* Lazy Loading Test */}
          <section ref={lazyRef} className="min-h-screen relative">
            <h2 className="text-2xl font-semibold mb-4">Lazy Loading Test</h2>
            <p className="text-gray-600 mb-4">
              Particles below only load when visible: {isVisible ? "Visible" : "Hidden"}
            </p>
            
            {shouldAnimate && (
              <>
                <FloatingParticles
                  count={recommendedSettings.maxParticleCount}
                  className="h-64"
                />
                <div className="relative z-10">
                  <AnimatedCard className="p-6 bg-white/80 backdrop-blur-sm">
                    <h3 className="font-semibold mb-2">Lazy Loaded Content</h3>
                    <p className="text-sm text-gray-600">
                      This content and its animations only load when scrolled into view,
                      improving initial page load performance.
                    </p>
                  </AnimatedCard>
                </div>
              </>
            )}
            
            {!shouldAnimate && (
              <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">
                  {prefersReducedMotion 
                    ? "Animations disabled (reduced motion)" 
                    : "Scroll down to load animations"
                  }
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
