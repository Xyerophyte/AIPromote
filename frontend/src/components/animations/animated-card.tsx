"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAnimationSettings } from "@/hooks/useReducedMotion"

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  hoverRotation?: number
  shadowIntensity?: "sm" | "md" | "lg" | "xl" | "2xl"
  borderRadius?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  glowEffect?: boolean
  glowColor?: string
  animateOnHover?: boolean
  animateOnView?: boolean
  initialDelay?: number
  duration?: number
  springConfig?: {
    type: "spring"
    stiffness: number
    damping: number
  }
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    children,
    className,
    hoverScale = 1.02,
    hoverRotation = 0,
    shadowIntensity = "md",
    borderRadius = "lg",
    glowEffect = false,
    glowColor = "rgba(59, 130, 246, 0.15)",
    animateOnHover = true,
    animateOnView = true,
    initialDelay = 0,
    duration = 0.3,
    springConfig = {
      type: "spring" as const,
      stiffness: 300,
      damping: 20
    },
    ...props 
  }, ref) => {
    const { prefersReducedMotion, spring, transition } = useAnimationSettings()
    const shadowClasses = {
      sm: "shadow-sm hover:shadow-md",
      md: "shadow-md hover:shadow-lg",
      lg: "shadow-lg hover:shadow-xl",
      xl: "shadow-xl hover:shadow-2xl",
      "2xl": "shadow-2xl hover:shadow-2xl"
    }

    const borderRadiusClasses = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl"
    }

    // Disable animations if user prefers reduced motion
    const shouldAnimate = !prefersReducedMotion
    
    const baseVariants = {
      initial: { 
        opacity: (animateOnView && shouldAnimate) ? 0 : 1, 
        y: (animateOnView && shouldAnimate) ? 20 : 0,
        scale: 1,
        rotate: 0
      },
      animate: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        rotate: 0
      },
      hover: (animateOnHover && shouldAnimate) ? {
        scale: hoverScale,
        rotate: hoverRotation,
        transition: prefersReducedMotion ? { duration: 0.01 } : springConfig
      } : {},
      tap: (animateOnHover && shouldAnimate) ? {
        scale: hoverScale * 0.98
      } : {}
    }

    // If user prefers reduced motion, render as regular div
    if (prefersReducedMotion) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative bg-card text-card-foreground border",
            shadowClasses[shadowIntensity],
            borderRadiusClasses[borderRadius],
            className
          )}
          {...props}
        >
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        variants={baseVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{
          duration: transition.duration,
          delay: initialDelay,
          ease: "easeOut"
        }}
        className={cn(
          "relative bg-card text-card-foreground border transition-all duration-300",
          shadowClasses[shadowIntensity],
          borderRadiusClasses[borderRadius],
          glowEffect && "hover:shadow-glow",
          className
        )}
        style={{
          willChange: shouldAnimate ? "transform, opacity, box-shadow" : "auto",
          ...(glowEffect && {
            "--glow-color": glowColor,
          } as React.CSSProperties),
        }}
        {...props}
      >
        {glowEffect && shouldAnimate && (
          <motion.div
            className="absolute inset-0 rounded-inherit opacity-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
              filter: "blur(8px)",
              zIndex: -1
            }}
            whileHover={{ opacity: 1 }}
          />
        )}
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = "AnimatedCard"

// Sub-components that work with AnimatedCard
const AnimatedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
AnimatedCardHeader.displayName = "AnimatedCardHeader"

const AnimatedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
AnimatedCardTitle.displayName = "AnimatedCardTitle"

const AnimatedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AnimatedCardDescription.displayName = "AnimatedCardDescription"

const AnimatedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
AnimatedCardContent.displayName = "AnimatedCardContent"

const AnimatedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
AnimatedCardFooter.displayName = "AnimatedCardFooter"

export { 
  AnimatedCard, 
  AnimatedCardHeader, 
  AnimatedCardFooter, 
  AnimatedCardTitle, 
  AnimatedCardDescription, 
  AnimatedCardContent 
}
