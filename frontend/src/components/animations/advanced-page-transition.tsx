"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export interface AdvancedPageTransitionProps {
  children: React.ReactNode
  className?: string
  effect?: "curtain" | "iris" | "wave" | "flip" | "zoom" | "slide-stack"
  direction?: "left" | "right" | "up" | "down"
  duration?: number
  stagger?: number
}

// Advanced transition effects
const advancedTransitions = {
  curtain: {
    initial: { 
      clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      opacity: 1
    },
    animate: { 
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.65, 0, 0.35, 1]
      }
    },
    exit: { 
      clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.65, 0, 0.35, 1]
      }
    }
  },

  iris: {
    initial: { 
      clipPath: "circle(0% at 50% 50%)",
      opacity: 1
    },
    animate: { 
      clipPath: "circle(150% at 50% 50%)",
      opacity: 1,
      transition: {
        duration: 0.9,
        ease: [0.76, 0, 0.24, 1]
      }
    },
    exit: { 
      clipPath: "circle(0% at 50% 50%)",
      opacity: 1,
      transition: {
        duration: 0.9,
        ease: [0.76, 0, 0.24, 1]
      }
    }
  },

  wave: {
    initial: { 
      clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      opacity: 1
    },
    animate: { 
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.55, 0.055, 0.675, 0.19]
      }
    }
  },

  flip: {
    initial: { 
      rotateY: 90, 
      opacity: 0,
      transformPerspective: 1000
    },
    animate: { 
      rotateY: 0, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      rotateY: -90, 
      opacity: 0,
      transition: {
        duration: 0.8,
        ease: [0.55, 0.055, 0.675, 0.19]
      }
    }
  },

  zoom: {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      filter: "blur(10px)"
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      scale: 1.1, 
      opacity: 0,
      filter: "blur(10px)",
      transition: {
        duration: 0.6,
        ease: [0.55, 0.055, 0.675, 0.19]
      }
    }
  },

  slideStack: {
    initial: (direction: string) => ({
      x: direction === "right" ? "100%" : direction === "left" ? "-100%" : 0,
      y: direction === "down" ? "100%" : direction === "up" ? "-100%" : 0,
      scale: 0.8,
      opacity: 0
    }),
    animate: { 
      x: 0,
      y: 0,
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }
    },
    exit: (direction: string) => ({
      x: direction === "right" ? "-30%" : direction === "left" ? "30%" : 0,
      y: direction === "down" ? "-30%" : direction === "up" ? "30%" : 0,
      scale: 1.1,
      opacity: 0,
      transition: {
        duration: 0.6,
        ease: [0.55, 0.055, 0.675, 0.19]
      }
    })
  }
}

const AdvancedPageTransition = React.forwardRef<HTMLDivElement, AdvancedPageTransitionProps>(
  ({ 
    children, 
    className,
    effect = "curtain",
    direction = "right",
    duration = 0.8,
    stagger = 0.1,
    ...props 
  }, ref) => {
    const pathname = usePathname()
    const variants = advancedTransitions[effect as keyof typeof advancedTransitions]

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
          className={cn("w-full", className)}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden"
          }}
          {...props}
        >
          <motion.div
            variants={{
              animate: { transition: { staggerChildren: stagger } }
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }
)

AdvancedPageTransition.displayName = "AdvancedPageTransition"

export { AdvancedPageTransition }

// Stagger children animation variant for complex layouts
export const staggerChildrenVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const childVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as any
    }
  }
} as any
