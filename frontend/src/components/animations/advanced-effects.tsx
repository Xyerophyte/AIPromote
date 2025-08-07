"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/components/animations/hooks/use-reduced-motion'
import { useLazyAnimation } from '@/components/animations/hooks/use-lazy-animation'
import { cn } from '@/lib/utils'

// ====================
// Magnetic Button Effect
// ====================

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
  disabled?: boolean
  onClick?: () => void
}

export function MagneticButton({ 
  children, 
  className, 
  strength = 0.4,
  disabled = false,
  onClick
}: MagneticButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || disabled || !ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength
    
    x.set(deltaX)
    y.set(deltaY)
  }, [x, y, strength, prefersReducedMotion, disabled])

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion || disabled) return
    x.set(0)
    y.set(0)
  }, [x, y, prefersReducedMotion, disabled])

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-200",
        "hover:shadow-xl hover:shadow-blue-500/25 will-change-transform",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </motion.button>
  )
}

// ====================
// Text Scramble Effect  
// ====================

interface TextScrambleProps {
  text: string
  trigger?: boolean
  duration?: number
  scrambleSpeed?: number
  className?: string
  onComplete?: () => void
}

export function TextScramble({ 
  text, 
  trigger = true, 
  duration = 2000,
  scrambleSpeed = 50,
  className,
  onComplete
}: TextScrambleProps) {
  const prefersReducedMotion = useReducedMotion()
  const [displayText, setDisplayText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-='

  const scramble = useCallback(() => {
    if (prefersReducedMotion || isAnimating) {
      setDisplayText(text)
      onComplete?.()
      return
    }

    setIsAnimating(true)
    let frame = 0
    const totalFrames = duration / scrambleSpeed

    const animate = () => {
      let result = ''
      
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          result += ' '
        } else if (frame > (i / text.length) * totalFrames) {
          result += text[i]
        } else {
          result += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      
      setDisplayText(result)
      
      if (frame < totalFrames) {
        frame++
        setTimeout(animate, scrambleSpeed)
      } else {
        setDisplayText(text)
        setIsAnimating(false)
        onComplete?.()
      }
    }
    
    animate()
  }, [text, duration, scrambleSpeed, chars, isAnimating, onComplete, prefersReducedMotion])

  useEffect(() => {
    if (trigger) {
      scramble()
    }
  }, [trigger, scramble])

  return (
    <span className={cn("font-mono will-change-contents", className)}>
      {displayText}
    </span>
  )
}

// ====================
// Morphing Icon Effect
// ====================

interface MorphingIconProps {
  icon1: React.ReactNode
  icon2: React.ReactNode
  isToggled: boolean
  size?: number
  className?: string
}

export function MorphingIcon({ 
  icon1, 
  icon2, 
  isToggled, 
  size = 24,
  className 
}: MorphingIconProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isToggled ? 'icon2' : 'icon1'}
          initial={!prefersReducedMotion ? { 
            scale: 0, 
            rotate: -180,
            opacity: 0 
          } : undefined}
          animate={!prefersReducedMotion ? { 
            scale: 1, 
            rotate: 0,
            opacity: 1 
          } : { opacity: 1 }}
          exit={!prefersReducedMotion ? { 
            scale: 0, 
            rotate: 180,
            opacity: 0 
          } : { opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          style={{ width: size, height: size }}
          className="flex items-center justify-center will-change-transform"
        >
          {isToggled ? icon2 : icon1}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ====================
// Liquid Loading Effect
// ====================

interface LiquidLoadingProps {
  progress: number
  size?: number
  color?: string
  backgroundColor?: string
  className?: string
}

export function LiquidLoading({ 
  progress = 0, 
  size = 100,
  color = "#3b82f6",
  backgroundColor = "#e5e7eb",
  className 
}: LiquidLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const { ref, shouldAnimate } = useLazyAnimation()
  
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const fillHeight = (clampedProgress / 100) * size

  if (!shouldAnimate) {
    return (
      <div 
        ref={ref}
        className={cn("rounded-full flex items-center justify-center", className)}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor 
        }}
      >
        <span className="text-sm font-medium text-gray-600">
          {Math.round(clampedProgress)}%
        </span>
      </div>
    )
  }

  return (
    <div 
      ref={ref}
      className={cn("relative rounded-full overflow-hidden", className)}
      style={{ width: size, height: size, backgroundColor }}
    >
      {/* Liquid fill */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ 
          height: fillHeight,
          ...(prefersReducedMotion ? {} : {
            borderRadius: [
              "0% 0% 50% 50%",
              "50% 50% 50% 50%", 
              "50% 50% 0% 0%",
              "0% 0% 50% 50%"
            ]
          })
        }}
        transition={{
          height: { type: "spring", stiffness: 100, damping: 15 },
          ...(!prefersReducedMotion && {
            borderRadius: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }
          })
        }}
      />
      
      {/* Wave effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0"
          style={{ 
            background: `radial-gradient(circle at center, transparent 30%, ${color}50 70%)` 
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-sm font-medium text-white mix-blend-difference"
          animate={!prefersReducedMotion ? { 
            scale: [1, 1.05, 1] 
          } : undefined}
          transition={!prefersReducedMotion ? {
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          } : undefined}
        >
          {Math.round(clampedProgress)}%
        </motion.span>
      </div>
    </div>
  )
}

// ====================
// Floating Action Button
// ====================

interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange'
  className?: string
  disabled?: boolean
}

export function FloatingActionButton({
  icon,
  onClick,
  size = 'md',
  color = 'blue',
  className,
  disabled = false
}: FloatingActionButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14', 
    lg: 'w-16 h-16'
  }
  
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25',
    green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/25',
    red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "fixed bottom-6 right-6 rounded-full flex items-center justify-center",
        "text-white shadow-lg hover:shadow-xl transition-all duration-200",
        "will-change-transform z-50",
        sizeClasses[size],
        colorClasses[color],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={!prefersReducedMotion && !disabled ? { 
        scale: 1.1,
        rotate: 15
      } : undefined}
      whileTap={!prefersReducedMotion && !disabled ? { 
        scale: 0.95 
      } : undefined}
      animate={!prefersReducedMotion ? {
        y: [0, -8, 0]
      } : undefined}
      transition={!prefersReducedMotion ? {
        y: {
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        },
        hover: { type: "spring", stiffness: 300, damping: 20 },
        tap: { type: "spring", stiffness: 400, damping: 10 }
      } : undefined}
    >
      <motion.div
        animate={!prefersReducedMotion ? { rotate: [0, 5, -5, 0] } : undefined}
        transition={!prefersReducedMotion ? {
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
          repeatDelay: 2
        } : undefined}
      >
        {icon}
      </motion.div>
    </motion.button>
  )
}
