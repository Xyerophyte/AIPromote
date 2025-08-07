"use client"

import React, { useState } from 'react'
import { AnimatedButton } from './animated-button'
import { 
  Play, 
  Heart, 
  Download, 
  Share, 
  Settings, 
  Zap, 
  Star, 
  ArrowRight,
  Loader2,
  CheckCircle
} from 'lucide-react'

export function AnimatedButtonDemo() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleLoadingDemo = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }))
    
    // Simulate loading
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }))
    }, 3000)
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Animated Button Components
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          A collection of beautiful, interactive button components with advanced animations, 
          hover effects, and customizable styling options.
        </p>
      </div>

      {/* Primary Buttons Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Primary Buttons</h2>
          <p className="text-gray-600">Gradient backgrounds with hover shine effects and ripple animations</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          
          <AnimatedButton 
            variant="primary" 
            size="lg"
            leftIcon={<Zap className="w-5 h-5" />}
            glowColor="rgba(147, 51, 234, 0.4)"
          >
            Supercharge
          </AnimatedButton>
        </div>
      </section>

      {/* Secondary Buttons Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Secondary Buttons</h2>
          <p className="text-gray-600">Border animations with scale effects and subtle shadows</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            rightIcon={<Share className="w-4 h-4" />}
            rippleColor="rgba(107, 114, 128, 0.3)"
          >
            Share
          </AnimatedButton>
          
          <AnimatedButton 
            variant="secondary" 
            size="sm"
            leftIcon={<Star className="w-4 h-4" />}
          >
            Add to Favorites
          </AnimatedButton>
        </div>
      </section>

      {/* Icon Buttons Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Icon Buttons</h2>
          <p className="text-gray-600">Circular buttons with rotating and pulsing icon animations</p>
        </div>
        
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
            leftIcon={<Share className="w-5 h-5" />}
            title="Share"
          />
          
          <AnimatedButton 
            variant="icon" 
            size="icon"
            leftIcon={<Download className="w-5 h-5" />}
            title="Download"
            glowColor="rgba(99, 102, 241, 0.4)"
          />
          
          <AnimatedButton 
            variant="icon" 
            size="icon"
            rightIcon={<Star className="w-5 h-5" />}
            title="Star"
            rippleColor="rgba(251, 191, 36, 0.6)"
          />
        </div>
      </section>

      {/* Loading Buttons Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Loading Buttons</h2>
          <p className="text-gray-600">Integrated spinner animations with progress indicators</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            leftIcon={loadingStates['save'] ? <Loader2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            onClick={() => handleLoadingDemo('save')}
          >
            Save Changes
          </AnimatedButton>
          
          <AnimatedButton 
            variant="loading"
            size="lg"
            loading={loadingStates['process'] || false}
            loadingText="Processing..."
            onClick={() => handleLoadingDemo('process')}
          >
            Process Data
          </AnimatedButton>
        </div>
      </section>

      {/* Additional Variants Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Additional Variants</h2>
          <p className="text-gray-600">Ghost and outline buttons with subtle animations</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedButton variant="ghost">
            Ghost Button
          </AnimatedButton>
          
          <AnimatedButton 
            variant="ghost" 
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Settings
          </AnimatedButton>
          
          <AnimatedButton variant="outline">
            Outline Style
          </AnimatedButton>
          
          <AnimatedButton 
            variant="outline" 
            rightIcon={<ArrowRight className="w-4 h-4" />}
            rippleColor="rgba(59, 130, 246, 0.3)"
          >
            Get Started
          </AnimatedButton>
        </div>
      </section>

      {/* Size Variants Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Size Variants</h2>
          <p className="text-gray-600">Different button sizes with consistent animations</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
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

      {/* Custom Colors Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Custom Colors & Effects</h2>
          <p className="text-gray-600">Buttons with custom glow colors and ripple effects</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatedButton 
            variant="primary" 
            glowColor="rgba(239, 68, 68, 0.4)"
            rippleColor="rgba(248, 113, 113, 0.6)"
          >
            Red Glow
          </AnimatedButton>
          
          <AnimatedButton 
            variant="primary" 
            glowColor="rgba(34, 197, 94, 0.4)"
            rippleColor="rgba(74, 222, 128, 0.6)"
          >
            Green Glow
          </AnimatedButton>
          
          <AnimatedButton 
            variant="primary" 
            glowColor="rgba(251, 191, 36, 0.4)"
            rippleColor="rgba(253, 224, 71, 0.6)"
          >
            Yellow Glow
          </AnimatedButton>
        </div>
      </section>

      {/* Code Example */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Usage Examples</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
          <pre className="text-sm text-gray-800">
            <code>{`import { AnimatedButton } from './components/ui/animated-button'
import { Play, ArrowRight } from 'lucide-react'

// Primary button with shine effect
<AnimatedButton variant="primary">
  Get Started
</AnimatedButton>

// Secondary button with icon and custom ripple
<AnimatedButton 
  variant="secondary" 
  leftIcon={<Play className="w-4 h-4" />}
  rippleColor="rgba(107, 114, 128, 0.3)"
>
  Play Video
</AnimatedButton>

// Icon button with rotating animation
<AnimatedButton 
  variant="icon" 
  size="icon"
  leftIcon={<Settings className="w-5 h-5" />}
/>

// Loading button with progress indicator
<AnimatedButton 
  variant="loading"
  loading={isLoading}
  loadingText="Processing..."
>
  Submit
</AnimatedButton>

// Custom glow and ripple colors
<AnimatedButton 
  variant="primary"
  glowColor="rgba(239, 68, 68, 0.4)"
  rippleColor="rgba(248, 113, 113, 0.6)"
>
  Custom Style
</AnimatedButton>`}
            </code>
          </pre>
        </div>
      </section>
    </div>
  )
}
