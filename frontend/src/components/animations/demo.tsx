"use client"

import * as React from "react"
import { 
  FadeIn, 
  SlideIn, 
  StaggerChildren, 
  AnimatedCard, 
  AnimatedCardHeader, 
  AnimatedCardTitle, 
  AnimatedCardDescription, 
  AnimatedCardContent, 
  GlassContainer 
} from "./index"

/**
 * Demo component showcasing all animation components
 * Use this as a reference for implementing animations in your app
 */
export function AnimationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Hero Section with FadeIn */}
        <section className="text-center">
          <FadeIn direction="down" delay={0.2} duration={1.2}>
            <h1 className="text-5xl font-bold text-white mb-6">
              Animation Components Library
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.5} duration={1.0}>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Beautiful, reusable animation components built with Framer Motion and Tailwind CSS
            </p>
          </FadeIn>
        </section>

        {/* SlideIn Examples */}
        <section>
          <FadeIn delay={0.8}>
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              Slide Animations
            </h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SlideIn direction="left" delay={1.0} easing="backOut">
              <div className="bg-blue-500/20 p-6 rounded-xl border border-blue-400/30 text-white text-center">
                <h3 className="font-semibold mb-2">Slide Left</h3>
                <p className="text-sm opacity-80">From left to center</p>
              </div>
            </SlideIn>
            
            <SlideIn direction="right" delay={1.2} easing="backOut">
              <div className="bg-green-500/20 p-6 rounded-xl border border-green-400/30 text-white text-center">
                <h3 className="font-semibold mb-2">Slide Right</h3>
                <p className="text-sm opacity-80">From right to center</p>
              </div>
            </SlideIn>
            
            <SlideIn direction="up" delay={1.4} easing="bounce">
              <div className="bg-purple-500/20 p-6 rounded-xl border border-purple-400/30 text-white text-center">
                <h3 className="font-semibold mb-2">Slide Up</h3>
                <p className="text-sm opacity-80">From bottom to center</p>
              </div>
            </SlideIn>
            
            <SlideIn direction="down" delay={1.6} easing="bounce">
              <div className="bg-pink-500/20 p-6 rounded-xl border border-pink-400/30 text-white text-center">
                <h3 className="font-semibold mb-2">Slide Down</h3>
                <p className="text-sm opacity-80">From top to center</p>
              </div>
            </SlideIn>
          </div>
        </section>

        {/* Staggered Children */}
        <section>
          <FadeIn delay={1.8}>
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              Staggered Animations
            </h2>
          </FadeIn>
          
          <StaggerChildren staggerDelay={0.2} direction="scale" initialDelay={2.0}>
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 rounded-xl border border-cyan-400/30 text-white">
              <h3 className="font-semibold mb-2">Feature One</h3>
              <p className="text-sm opacity-80">This item appears first in the stagger sequence</p>
            </div>
            
            <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 p-6 rounded-xl border border-violet-400/30 text-white">
              <h3 className="font-semibold mb-2">Feature Two</h3>
              <p className="text-sm opacity-80">This item appears second with a slight delay</p>
            </div>
            
            <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 p-6 rounded-xl border border-rose-400/30 text-white">
              <h3 className="font-semibold mb-2">Feature Three</h3>
              <p className="text-sm opacity-80">This item appears last in the sequence</p>
            </div>
          </StaggerChildren>
        </section>

        {/* Animated Cards */}
        <section>
          <FadeIn delay={2.5}>
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              Animated Cards
            </h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard 
              hoverScale={1.05} 
              shadowIntensity="xl" 
              glowEffect={true}
              glowColor="rgba(59, 130, 246, 0.3)"
              borderRadius="xl"
              initialDelay={2.7}
            >
              <AnimatedCardHeader>
                <AnimatedCardTitle className="text-white">Premium Card</AnimatedCardTitle>
                <AnimatedCardDescription className="text-slate-300">
                  Enhanced with glow effects and hover animations
                </AnimatedCardDescription>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Hover for scale effect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm">Beautiful glow effect</span>
                  </div>
                </div>
              </AnimatedCardContent>
            </AnimatedCard>
            
            <AnimatedCard 
              hoverScale={1.03} 
              hoverRotation={2}
              shadowIntensity="lg"
              borderRadius="2xl"
              initialDelay={2.9}
            >
              <AnimatedCardHeader>
                <AnimatedCardTitle className="text-white">Rotated Card</AnimatedCardTitle>
                <AnimatedCardDescription className="text-slate-300">
                  Subtle rotation effect on hover
                </AnimatedCardDescription>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <p className="text-slate-300 text-sm">
                  This card rotates slightly when you hover over it, creating a dynamic interaction.
                </p>
              </AnimatedCardContent>
            </AnimatedCard>
            
            <AnimatedCard 
              hoverScale={1.08}
              shadowIntensity="2xl"
              borderRadius="lg"
              initialDelay={3.1}
              springConfig={{
                type: "spring",
                stiffness: 400,
                damping: 10
              }}
            >
              <AnimatedCardHeader>
                <AnimatedCardTitle className="text-white">Spring Animation</AnimatedCardTitle>
                <AnimatedCardDescription className="text-slate-300">
                  Custom spring configuration
                </AnimatedCardDescription>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <p className="text-slate-300 text-sm">
                  This card uses a bouncy spring animation with custom stiffness and damping.
                </p>
              </AnimatedCardContent>
            </AnimatedCard>
          </div>
        </section>

        {/* Glass Containers */}
        <section>
          <FadeIn delay={3.5}>
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              Glass Morphism
            </h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassContainer 
              blurIntensity="xl" 
              borderIntensity="medium"
              shadowIntensity="xl"
              className="p-8"
              initialDelay={3.7}
              glowOnHover={true}
              glowColor="rgba(139, 92, 246, 0.3)"
            >
              <h3 className="text-2xl font-semibold text-white mb-4">
                Glass Effect One
              </h3>
              <p className="text-white/80 mb-4">
                This glass container features a beautiful backdrop blur effect with subtle borders 
                and a hover glow effect.
              </p>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-white/10 rounded-full text-white text-xs border border-white/20">
                  Backdrop Blur
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-white text-xs border border-white/20">
                  Hover Glow
                </div>
              </div>
            </GlassContainer>
            
            <GlassContainer 
              blurIntensity="lg" 
              borderIntensity="strong"
              gradient={true}
              gradientFrom="rgba(255, 255, 255, 0.15)"
              gradientTo="rgba(255, 255, 255, 0.05)"
              className="p-8"
              initialDelay={3.9}
            >
              <h3 className="text-2xl font-semibold text-white mb-4">
                Glass Effect Two
              </h3>
              <p className="text-white/80 mb-4">
                This variant uses a custom gradient background with stronger borders 
                for enhanced definition.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                    1
                  </div>
                  <span>Custom gradient background</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                    2
                  </div>
                  <span>Strong border definition</span>
                </div>
              </div>
            </GlassContainer>
          </div>
        </section>

        {/* Combined Example */}
        <section>
          <FadeIn delay={4.2}>
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              Combined Effects
            </h2>
          </FadeIn>
          
          <GlassContainer 
            blurIntensity="2xl"
            borderIntensity="subtle" 
            className="p-8"
            initialDelay={4.4}
          >
            <StaggerChildren staggerDelay={0.15} direction="up" initialDelay={4.6}>
              <FadeIn direction="left" delay={0}>
                <h3 className="text-3xl font-bold text-white mb-6">
                  🎉 Animation Showcase Complete
                </h3>
              </FadeIn>
              
              <SlideIn direction="right" delay={0.3}>
                <p className="text-white/90 text-lg mb-6">
                  You've seen all five animation components in action. Each component offers 
                  extensive customization options for creating unique user experiences.
                </p>
              </SlideIn>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="text-white font-medium">FadeIn</div>
                  <div className="text-white/60 text-xs">Smooth entrances</div>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="text-white font-medium">SlideIn</div>
                  <div className="text-white/60 text-xs">Directional slides</div>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-white font-medium">StaggerChildren</div>
                  <div className="text-white/60 text-xs">Sequential animations</div>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🎴</div>
                  <div className="text-white font-medium">AnimatedCard</div>
                  <div className="text-white/60 text-xs">Interactive cards</div>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🪟</div>
                  <div className="text-white font-medium">GlassContainer</div>
                  <div className="text-white/60 text-xs">Glassmorphism</div>
                </div>
              </div>
            </StaggerChildren>
          </GlassContainer>
        </section>
      </div>
    </div>
  )
}
