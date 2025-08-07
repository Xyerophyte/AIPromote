"use client"

import React, { useState } from 'react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { 
  Play, 
  Heart, 
  Download, 
  Settings, 
  Zap, 
  Star, 
  ArrowRight,
} from 'lucide-react'

export default function ButtonDemoPage() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleLoadingDemo = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }))
    
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }))
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Animated Button Components
          </h1>
          <p className="text-gray-600 text-lg">
            Interactive button components with advanced animations and effects
          </p>
        </div>

        {/* Primary Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Primary Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton variant="primary">
              Get Started
            </AnimatedButton>
            
            <AnimatedButton 
              variant="primary" 
              leftIcon={<Play className="w-4 h-4" />}
            >
              Play Video
            </AnimatedButton>
            
            <AnimatedButton 
              variant="primary" 
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </AnimatedButton>
          </div>
        </section>

        {/* Secondary Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Secondary Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton variant="secondary">
              Learn More
            </AnimatedButton>
            
            <AnimatedButton 
              variant="secondary" 
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </AnimatedButton>
            
            <AnimatedButton 
              variant="secondary" 
              size="sm"
              leftIcon={<Star className="w-4 h-4" />}
            >
              Favorite
            </AnimatedButton>
          </div>
        </section>

        {/* Icon Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Icon Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton 
              variant="icon" 
              size="icon"
              leftIcon={<Heart className="w-5 h-5" />}
              title="Like"
            />
            
            <AnimatedButton 
              variant="icon" 
              size="icon"
              leftIcon={<Settings className="w-5 h-5" />}
              title="Settings"
            />
            
            <AnimatedButton 
              variant="icon" 
              size="icon"
              leftIcon={<Download className="w-5 h-5" />}
              title="Download"
            />
          </div>
        </section>

        {/* Loading Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Loading Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton 
              variant="loading"
              loading={loadingStates['submit'] || false}
              loadingText="Submitting..."
              onClick={() => handleLoadingDemo('submit')}
            >
              Submit Form
            </AnimatedButton>
            
            <AnimatedButton 
              variant="loading"
              loading={loadingStates['save'] || false}
              loadingText="Saving..."
              onClick={() => handleLoadingDemo('save')}
            >
              Save Changes
            </AnimatedButton>
          </div>
        </section>

        {/* Other Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Other Variants</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton variant="ghost">
              Ghost Button
            </AnimatedButton>
            
            <AnimatedButton variant="outline">
              Outline Style
            </AnimatedButton>
            
            <AnimatedButton 
              variant="outline" 
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started
            </AnimatedButton>
          </div>
        </section>

        {/* Custom Colors */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Custom Colors</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton 
              variant="primary" 
              glowColor="rgba(239, 68, 68, 0.4)"
              rippleColor="rgba(248, 113, 113, 0.6)"
            >
              Red Theme
            </AnimatedButton>
            
            <AnimatedButton 
              variant="primary" 
              glowColor="rgba(34, 197, 94, 0.4)"
              rippleColor="rgba(74, 222, 128, 0.6)"
            >
              Green Theme
            </AnimatedButton>
            
            <AnimatedButton 
              variant="primary" 
              glowColor="rgba(251, 191, 36, 0.4)"
              rippleColor="rgba(253, 224, 71, 0.6)"
            >
              Gold Theme
            </AnimatedButton>
          </div>
        </section>

        {/* Size Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Size Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <AnimatedButton variant="primary" size="sm">
              Small
            </AnimatedButton>
            
            <AnimatedButton variant="primary" size="default">
              Default
            </AnimatedButton>
            
            <AnimatedButton variant="primary" size="lg">
              Large
            </AnimatedButton>
          </div>
        </section>
      </div>
    </div>
  )
}
