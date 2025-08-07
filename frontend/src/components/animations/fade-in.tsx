"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAnimationSettings, useReducedMotion } from "@/hooks/useReducedMotion"

export interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  once?: boolean
  threshold?: number
}

const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
  ({ 
    children, 
    className,
    delay = 0,
    duration = 0.6,
    direction = "up",
    distance = 30,
    once = true,
    threshold = 0.1,
    ...props 
  }, ref) => {
    const { prefersReducedMotion, transition } = useAnimationSettings()
    const getInitialPosition = () => {
      switch (direction) {
        case "up":
          return { y: distance, opacity: 0 }
        case "down":
          return { y: -distance, opacity: 0 }
        case "left":
          return { x: distance, opacity: 0 }
        case "right":
          return { x: -distance, opacity: 0 }
        default:
          return { opacity: 0 }
      }
    }

    const getAnimatePosition = () => {
      switch (direction) {
        case "up":
        case "down":
          return { y: 0, opacity: 1 }
        case "left":
        case "right":
          return { x: 0, opacity: 1 }
        default:
          return { opacity: 1 }
      }
    }

    // If user prefers reduced motion, render without animation
    if (prefersReducedMotion) {
      return (
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        initial={getInitialPosition()}
        whileInView={getAnimatePosition()}
        transition={{ 
          duration: transition.duration, 
          delay,
          ease: "easeOut"
        }}
        viewport={{ 
          once,
          amount: threshold 
        }}
        className={cn("", className)}
        style={{ willChange: "transform, opacity" }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

FadeIn.displayName = "FadeIn"

export { FadeIn }
