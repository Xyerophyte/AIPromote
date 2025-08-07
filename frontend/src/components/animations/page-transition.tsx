"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  type?: "fade" | "slide" | "scale" | "mixed"
  direction?: "left" | "right" | "up" | "down"
  duration?: number
  delay?: number
}

// Page transition variants
const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: (direction: string) => ({
      opacity: 0,
      x: direction === "right" ? 100 : direction === "left" ? -100 : 0,
      y: direction === "down" ? 100 : direction === "up" ? -100 : 0,
    }),
    animate: { opacity: 1, x: 0, y: 0 },
    exit: (direction: string) => ({
      opacity: 0,
      x: direction === "right" ? -100 : direction === "left" ? 100 : 0,
      y: direction === "down" ? -100 : direction === "up" ? 100 : 0,
    })
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  },
  mixed: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 1.02 }
  }
}

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ 
    children, 
    className,
    type = "mixed",
    direction = "right",
    duration = 0.3,
    delay = 0,
    ...props 
  }, ref) => {
    const pathname = usePathname()
    const variants = transitionVariants[type]

    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          ref={ref}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration,
            delay,
            ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
            layout: { duration: duration * 0.7 } // Slightly faster layout animations
          }}
          className={cn("w-full", className)}
          {...props}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )
  }
)

PageTransition.displayName = "PageTransition"

export { PageTransition }
