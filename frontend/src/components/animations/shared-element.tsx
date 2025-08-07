"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

export interface SharedElementProps extends Omit<MotionProps, "layoutId"> {
  children: React.ReactNode
  className?: string
  layoutId: string
  type?: "morph" | "crossfade" | "scale"
  duration?: number
  onClick?: () => void
  springConfig?: {
    type: "spring"
    damping?: number
    stiffness?: number
  }
}

// Shared element transition presets
const sharedElementPresets = {
  morph: {
    layout: true,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  crossfade: {
    layout: true,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400
    }
  },
  scale: {
    layout: true,
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 400
    }
  }
}

const SharedElement = React.forwardRef<HTMLDivElement, SharedElementProps>(
  ({ 
    children, 
    className,
    layoutId,
    type = "morph",
    duration = 0.6,
    springConfig,
    ...props 
  }, ref) => {
    const preset = sharedElementPresets[type]
    
    // Merge custom spring config with preset
    const transition = springConfig 
      ? { ...preset.transition, ...springConfig, duration } as any
      : { ...preset.transition, duration } as any

    return (
      <motion.div
        ref={ref}
        layoutId={layoutId}
        className={cn("", className)}
        {...preset}
        transition={transition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

SharedElement.displayName = "SharedElement"

export { SharedElement }

// Hook for managing shared element IDs
export const useSharedElementId = (baseId: string, suffix?: string) => {
  return React.useMemo(() => {
    return suffix ? `${baseId}-${suffix}` : baseId
  }, [baseId, suffix])
}
