"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface StaggerChildrenProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "scale" | "fade"
  distance?: number
  once?: boolean
  threshold?: number
  reverse?: boolean
}

const StaggerChildren = React.forwardRef<HTMLDivElement, StaggerChildrenProps>(
  ({ 
    children, 
    className,
    staggerDelay = 0.1,
    initialDelay = 0,
    duration = 0.6,
    direction = "up",
    distance = 20,
    once = true,
    threshold = 0.1,
    reverse = false,
    ...props 
  }, ref) => {
    const getVariants = () => {
      const baseVariants = {
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: {
            staggerChildren: reverse ? -staggerDelay : staggerDelay,
            delayChildren: initialDelay
          }
        }
      }

      const childVariants = {
        fade: {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { duration }
          }
        },
        up: {
          hidden: { opacity: 0, y: distance },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration }
          }
        },
        down: {
          hidden: { opacity: 0, y: -distance },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration }
          }
        },
        left: {
          hidden: { opacity: 0, x: distance },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: { duration }
          }
        },
        right: {
          hidden: { opacity: 0, x: -distance },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: { duration }
          }
        },
        scale: {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration, type: "spring" }
          }
        }
      }

      return {
        container: baseVariants,
        item: childVariants[direction] || childVariants.up
      }
    }

    const variants = getVariants()

    const cloneChildrenWithVariants = (children: React.ReactNode): React.ReactNode => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return (
            <motion.div variants={variants.item}>
              {child}
            </motion.div>
          )
        }
        return child
      })
    }

    return (
      <motion.div
        ref={ref}
        variants={variants.container}
        initial="hidden"
        whileInView="visible"
        viewport={{ 
          once,
          amount: threshold 
        }}
        className={cn("", className)}
        {...props}
      >
        {cloneChildrenWithVariants(children)}
      </motion.div>
    )
  }
)

StaggerChildren.displayName = "StaggerChildren"

export { StaggerChildren }
