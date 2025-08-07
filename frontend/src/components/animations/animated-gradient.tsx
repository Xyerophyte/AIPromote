"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface AnimatedGradientProps {
  children?: React.ReactNode
  className?: string
  colors?: string[]
  speed?: number
  opacity?: number
}

const AnimatedGradient = React.forwardRef<HTMLDivElement, AnimatedGradientProps>(
  ({ 
    children, 
    className,
    colors = [
      "from-blue-50 via-white to-purple-50",
      "from-purple-50 via-blue-50 to-white",
      "from-white via-purple-50 to-blue-50",
      "from-blue-50 via-purple-50 to-white"
    ],
    speed = 8,
    opacity = 1,
    ...props 
  }, ref) => {
    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br"
          animate={{
            background: colors.map(color => 
              `linear-gradient(135deg, ${color.replace(/from-|via-|to-/g, '').split(' ').map(c => `var(--${c.replace('-', '-').replace(/\d+/, m => `${m}00`)})`).join(', ')})`
            )
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{ opacity }}
        />
        
        {/* Alternative CSS-based animated gradient for better performance */}
        <div 
          className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-blue-50 via-white to-purple-50"
          style={{ 
            backgroundSize: '400% 400%',
            opacity
          }}
        />
        
        {/* Content layer */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

AnimatedGradient.displayName = "AnimatedGradient"

export { AnimatedGradient }
