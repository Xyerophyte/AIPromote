"use client"

import React, { useState, useEffect } from 'react'
import { 
  MagneticButton,
  TextScramble,
  MorphingIcon,
  LiquidLoading,
  FloatingActionButton,
  CardStack3D,
  DEMO_CARDS,
  FadeIn,
  SlideIn,
  AnimatedCard
} from '@/components/animations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Heart, 
  Star, 
  PlayCircle, 
  PauseCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  Settings,
  Download
} from 'lucide-react'
import { useAnimationPerformanceMonitor } from '@/components/animations/hooks/use-animation-performance-monitor'

export default function AdvancedAnimationsDemo() {
  const [scrambleTrigger, setScrambleTrigger] = useState(false)
  const [morphToggle, setMorphToggle] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const { 
    startMonitoring, 
    stopMonitoring, 
    getCurrentMetrics, 
    isLowPerformanceDevice,
    recommendedSettings
  } = useAnimationPerformanceMonitor()

  // Simulate progress loading
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 5
        return newProgress > 100 ? 0 : newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  const handleStartMonitoring = async () => {
    setIsMonitoring(true)
    startMonitoring()
    
    setTimeout(() => {
      stopMonitoring()
      setIsMonitoring(false)
    }, 5000)
  }

  const metrics = getCurrentMetrics()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <FadeIn className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Advanced Animation Effects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive showcase of advanced animation components with performance monitoring and accessibility optimizations.
          </p>
        </FadeIn>

        {/* Performance Monitor Section */}
        <SlideIn direction="up" className="mb-12">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time performance metrics and device optimization detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Device Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Device Status</h4>
                  <div className="text-sm space-y-1">
                    <div>Performance: <span className={`font-medium ${isLowPerformanceDevice() ? 'text-orange-600' : 'text-green-600'}`}>
                      {isLowPerformanceDevice() ? 'Low' : 'High'}
                    </span></div>
                    <div>Recommended FPS: <span className="font-medium text-blue-600">
                      {recommendedSettings.maxFps}
                    </span></div>
                    <div>Animation Duration: <span className="font-medium text-blue-600">
                      {recommendedSettings.animationDuration}ms
                    </span></div>
                  </div>
                </div>
                
                {/* Current Metrics */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Current Metrics</h4>
                  <div className="text-sm space-y-1">
                    <div>FPS: <span className="font-medium text-blue-600">
                      {metrics.fps.toFixed(1)}
                    </span></div>
                    <div>Frame Drops: <span className="font-medium text-purple-600">
                      {metrics.frameDrops}
                    </span></div>
                    <div>Avg Frame Time: <span className="font-medium text-green-600">
                      {metrics.averageFrameTime.toFixed(2)}ms
                    </span></div>
                  </div>
                </div>
                
                {/* Monitor Control */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Controls</h4>
                  <Button 
                    onClick={handleStartMonitoring}
                    disabled={isMonitoring}
                    size="sm"
                    className="w-full"
                  >
                    {isMonitoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Monitoring...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start 5s Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideIn>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* Magnetic Button Demo */}
          <FadeIn delay={0.1}>
            <AnimatedCard className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Magnetic Button
                </CardTitle>
                <CardDescription>
                  Buttons that follow your cursor with spring physics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 items-center">
                  <MagneticButton 
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium"
                    strength={0.4}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Hover me!
                  </MagneticButton>
                  
                  <MagneticButton 
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full font-medium"
                    strength={0.6}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Stronger pull
                  </MagneticButton>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Move your cursor over the buttons to see the magnetic effect.
                </p>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* Text Scramble Demo */}
          <FadeIn delay={0.2}>
            <AnimatedCard className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                  Text Scramble
                </CardTitle>
                <CardDescription>
                  Text that scrambles and reveals itself character by character
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <TextScramble 
                    text="AI-Powered Marketing"
                    trigger={scrambleTrigger}
                    duration={2000}
                    scrambleSpeed={60}
                    className="text-xl font-bold text-gray-900"
                  />
                </div>
                <Button 
                  onClick={() => setScrambleTrigger(!scrambleTrigger)}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scramble Text
                </Button>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* Morphing Icon Demo */}
          <FadeIn delay={0.3}>
            <AnimatedCard className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  Morphing Icons
                </CardTitle>
                <CardDescription>
                  Icons that smoothly transform with spring animations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center items-center p-6 bg-gray-50 rounded-lg">
                  <MorphingIcon
                    icon1={<Heart className="w-8 h-8 text-red-500" />}
                    icon2={<Star className="w-8 h-8 text-yellow-500" />}
                    isToggled={morphToggle}
                    size={40}
                  />
                </div>
                <Button 
                  onClick={() => setMorphToggle(!morphToggle)}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Toggle Icon
                </Button>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* Liquid Loading Demo */}
          <FadeIn delay={0.4}>
            <AnimatedCard className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  Liquid Loading
                </CardTitle>
                <CardDescription>
                  Blob-like loading animations with wave effects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center items-center">
                  <LiquidLoading 
                    progress={progress}
                    size={120}
                    color="#8b5cf6"
                    backgroundColor="#f3f4f6"
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <LiquidLoading 
                    progress={75}
                    size={60}
                    color="#10b981"
                  />
                  <LiquidLoading 
                    progress={45}
                    size={60}
                    color="#f59e0b"
                  />
                  <LiquidLoading 
                    progress={90}
                    size={60}
                    color="#ef4444"
                  />
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* 3D Card Stack Demo */}
          <FadeIn delay={0.5} className="lg:col-span-2">
            <AnimatedCard className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  3D Card Stack
                </CardTitle>
                <CardDescription>
                  Interactive 3D card stack with drag, swipe, and physics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardStack3D 
                  cards={DEMO_CARDS}
                  onCardChange={(index) => console.log('Card changed to:', index)}
                />
              </CardContent>
            </AnimatedCard>
          </FadeIn>

        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={<Download className="w-6 h-6" />}
          onClick={() => alert('Floating action triggered!')}
          color="purple"
          size="lg"
        />

      </div>
    </div>
  )
}
