"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAnimationSettings } from "@/hooks/useReducedMotion"

export interface SlideInProps {
  children: React.ReactNode
  className?: string
  direction: "left" | "right" | "up" | "down"
  distance?: number
  delay?: number
  duration?: number
  once?: boolean
  threshold?: number
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "backOut" | "bounce"
}

const SlideIn = React.forwardRef<HTMLDivElement, SlideInProps>(
  ({ 
    children, 
    className,
    direction,
    distance = 100,
    delay = 0,
    duration = 0.8,
    once = true,
    threshold = 0.1,
    easing = "easeOut",
    ...props 
  }, ref) => {
    const { prefersReducedMotion, transition } = useAnimationSettings()
    const getInitialPosition = () => {
      switch (direction) {
        case "left":
          return { x: -distance, opacity: 0 }
        case "right":
          return { x: distance, opacity: 0 }
        case "up":
          return { y: -distance, opacity: 0 }
        case "down":
          return { y: distance, opacity: 0 }
        default:
          return { opacity: 0 }
      }
    }

    const getEasing = () => {
      const easings: Record<string, string | number[]> = {
        linear: "linear",
        easeIn: "easeIn",
        easeOut: "easeOut", 
        easeInOut: "easeInOut",
        backOut: [0.175, 0.885, 0.32, 1.275],
        bounce: [0.68, -0.55, 0.265, 1.55]
      }
      return easings[easing] || "easeOut"
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
        whileInView={{ 
          x: 0, 
          y: 0, 
          opacity: 1 
        }}
        transition={{ 
          duration: transition.duration, 
          delay,
          ease: getEasing()
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

SlideIn.displayName = "SlideIn"

export { SlideIn }
