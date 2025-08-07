"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  blurIntensity?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  opacity?: number
  borderIntensity?: "none" | "subtle" | "medium" | "strong"
  shadowIntensity?: "none" | "sm" | "md" | "lg" | "xl"
  borderRadius?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
  gradient?: boolean
  gradientFrom?: string
  gradientTo?: string
  animateOnHover?: boolean
  animateOnView?: boolean
  hoverScale?: number
  initialDelay?: number
  duration?: number
  glowOnHover?: boolean
  glowColor?: string
}

const GlassContainer = React.forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ 
    children,
    className,
    blurIntensity = "md",
    opacity = 0.1,
    borderIntensity = "subtle",
    shadowIntensity = "lg",
    borderRadius = "xl",
    gradient = true,
    gradientFrom = "rgba(255, 255, 255, 0.1)",
    gradientTo = "rgba(255, 255, 255, 0.05)",
    animateOnHover = true,
    animateOnView = true,
    hoverScale = 1.01,
    initialDelay = 0,
    duration = 0.3,
    glowOnHover = false,
    glowColor = "rgba(255, 255, 255, 0.2)",
    ...props 
  }, ref) => {
    const blurClasses = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md", 
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl",
      "2xl": "backdrop-blur-2xl",
      "3xl": "backdrop-blur-3xl"
    }

    const borderClasses = {
      none: "",
      subtle: "border border-white/10",
      medium: "border border-white/20", 
      strong: "border border-white/30"
    }

    const shadowClasses = {
      none: "",
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl"
    }

    const borderRadiusClasses = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg", 
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full"
    }

    const baseVariants = {
      initial: {
        opacity: animateOnView ? 0 : 1,
        scale: animateOnView ? 0.95 : 1,
        y: animateOnView ? 10 : 0
      },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0
      },
      hover: animateOnHover ? {
        scale: hoverScale
      } : {}
    }

    const gradientStyle = gradient ? {
      background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
    } : {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`
    }

    return (
      <motion.div
        ref={ref}
        variants={baseVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        transition={{
          duration,
          delay: initialDelay,
          ease: "easeOut"
        }}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          blurClasses[blurIntensity],
          borderClasses[borderIntensity],
          shadowClasses[shadowIntensity],
          borderRadiusClasses[borderRadius],
          className
        )}
        style={{
          ...gradientStyle,
          ...(glowOnHover && {
            "--glow-color": glowColor,
          } as React.CSSProperties),
        }}
        {...props}
      >
        {/* Optional glow effect on hover */}
        {glowOnHover && (
          <motion.div
            className="absolute inset-0 rounded-inherit opacity-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
              filter: "blur(10px)",
              zIndex: -1
            }}
            whileHover={{ opacity: 1 }}
          />
        )}
        
        {/* Subtle inner glow/highlight */}
        <div 
          className="absolute inset-0 rounded-inherit opacity-30"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)"
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
)

GlassContainer.displayName = "GlassContainer"

export { GlassContainer }
