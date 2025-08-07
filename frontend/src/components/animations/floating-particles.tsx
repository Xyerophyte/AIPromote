"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useLazyAnimation } from "@/hooks/useLazyAnimation"
import { useAnimationSettings } from "@/hooks/useReducedMotion"

export interface FloatingParticlesProps {
  className?: string
  count?: number
  colors?: string[]
  size?: { min: number; max: number }
  speed?: { min: number; max: number }
  opacity?: { min: number; max: number }
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
  opacity: number
}

const FloatingParticles = React.forwardRef<HTMLDivElement, FloatingParticlesProps>(
  ({ 
    className,
    count = 20,
    colors = ["bg-blue-200", "bg-purple-200", "bg-pink-200", "bg-indigo-200"],
    size = { min: 4, max: 12 },
    speed = { min: 20, max: 40 },
    opacity = { min: 0.3, max: 0.7 },
    ...props 
  }, ref) => {
    const { prefersReducedMotion } = useAnimationSettings()
    const { ref: lazyRef, shouldAnimate } = useLazyAnimation({
      threshold: 0.1,
      triggerOnce: true
    })
    const [particles, setParticles] = React.useState<Particle[]>([])
    
    // Combine refs
    React.useImperativeHandle(ref, () => lazyRef.current!, [])

    React.useEffect(() => {
      // Only generate particles if animations should run
      if (!shouldAnimate || prefersReducedMotion) {
        setParticles([])
        return
      }

      const generateParticles = (): Particle[] => {
        return Array.from({ length: count }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * (size.max - size.min) + size.min,
          color: colors[Math.floor(Math.random() * colors.length)],
          duration: Math.random() * (speed.max - speed.min) + speed.min,
          delay: Math.random() * 5,
          opacity: Math.random() * (opacity.max - opacity.min) + opacity.min
        }))
      }

      setParticles(generateParticles())
    }, [shouldAnimate, prefersReducedMotion, count, colors, size.max, size.min, speed.max, speed.min, opacity.max, opacity.min])

    // If reduced motion is preferred, render nothing or static version
    if (prefersReducedMotion || !shouldAnimate) {
      return null
    }

    return (
      <div 
        ref={lazyRef} 
        className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} 
        {...props}
      >
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${particle.color} blur-sm`}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
              willChange: "transform, opacity"
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() > 0.5 ? 20 : -20, 0],
              scale: [1, 1.2, 1],
              opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    )
  }
)

FloatingParticles.displayName = "FloatingParticles"

export { FloatingParticles }
