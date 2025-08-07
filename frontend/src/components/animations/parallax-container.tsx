"use client"

import * as React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export interface ParallaxContainerProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: "up" | "down"
  offset?: string[]
}

const ParallaxContainer = React.forwardRef<HTMLDivElement, ParallaxContainerProps>(
  ({ 
    children, 
    className,
    speed = 0.5,
    direction = "up",
    offset = ["start end", "end start"],
    ...props 
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const containerRef = React.useRef<HTMLDivElement>(null)
    
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: offset as [string, string]
    })
    
    // Disable parallax effect if user prefers reduced motion
    const y = useTransform(
      scrollYProgress,
      [0, 1],
      prefersReducedMotion ? [0, 0] : (
        direction === "up" 
          ? [0, -100 * speed] 
          : [0, 100 * speed]
      )
    )

    // For reduced motion, render without parallax effect
    if (prefersReducedMotion) {
      return (
        <div ref={containerRef} className={cn("relative", className)}>
          <div ref={ref} {...props}>
            {children}
          </div>
        </div>
      )
    }

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <motion.div
          ref={ref}
          style={{ 
            y,
            willChange: "transform"
          }}
          {...props}
        >
          {children}
        </motion.div>
      </div>
    )
  }
)

ParallaxContainer.displayName = "ParallaxContainer"

export { ParallaxContainer }
