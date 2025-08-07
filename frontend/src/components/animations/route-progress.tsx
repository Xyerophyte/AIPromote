"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

export interface RouteProgressProps {
  className?: string
  color?: string
  height?: number
  duration?: number
  showOnRouteChange?: boolean
  position?: "top" | "bottom"
}

const RouteProgressContent = React.forwardRef<HTMLDivElement, RouteProgressProps>(
  ({ 
    className,
    color = "bg-blue-500",
    height = 3,
    duration = 0.8,
    showOnRouteChange = true,
    position = "top",
    ...props 
  }, ref) => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
      if (!showOnRouteChange) return

      setIsLoading(true)
      
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, duration * 1000)

      return () => clearTimeout(timer)
    }, [pathname, searchParams, duration, showOnRouteChange])

    const progressVariants = {
      initial: { 
        scaleX: 0, 
        originX: 0,
        opacity: 1
      },
      animate: { 
        scaleX: 1, 
        originX: 0,
        opacity: 1,
        transition: {
          duration: duration * 0.8,
          ease: [0.22, 1, 0.36, 1] as any
        }
      },
      exit: { 
        scaleX: 1,
        originX: 1,
        opacity: 0,
        transition: {
          duration: duration * 0.2,
          ease: "easeOut"
        }
      }
    }

    const containerVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "fixed left-0 right-0 z-50",
          position === "top" ? "top-0" : "bottom-0",
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full overflow-hidden"
              style={{ height }}
            >
              <motion.div
                variants={progressVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  "h-full origin-left",
                  color
                )}
                style={{ 
                  background: `linear-gradient(90deg, 
                    currentColor 0%, 
                    rgba(255,255,255,0.8) 50%, 
                    currentColor 100%
                  )`
                }}
              />
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                  background: [
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.8) 60%, transparent 100%)"
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

RouteProgressContent.displayName = "RouteProgressContent"

// Main RouteProgress component wrapped with Suspense
const RouteProgress = React.forwardRef<HTMLDivElement, RouteProgressProps>(
  (props, ref) => {
    return (
      <Suspense fallback={null}>
        <RouteProgressContent ref={ref} {...props} />
      </Suspense>
    )
  }
)

RouteProgress.displayName = "RouteProgress"

export { RouteProgress }

// Hook for manual progress control
export const useRouteProgress = () => {
  const [isLoading, setIsLoading] = React.useState(false)
  
  const start = React.useCallback(() => setIsLoading(true), [])
  const finish = React.useCallback(() => setIsLoading(false), [])
  
  return { isLoading, start, finish }
}
