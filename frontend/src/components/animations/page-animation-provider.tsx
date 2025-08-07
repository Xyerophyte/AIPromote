"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { PageTransition } from "./page-transition"
import { AdvancedPageTransition } from "./advanced-page-transition" 
import { RouteProgress } from "./route-progress"
import { cn } from "@/lib/utils"

export interface PageAnimationContextType {
  transitionType: "basic" | "advanced"
  effect: string
  direction: "left" | "right" | "up" | "down"
  duration: number
  enableProgressBar: boolean
  setTransitionType: (type: "basic" | "advanced") => void
  setEffect: (effect: string) => void
  setDirection: (direction: "left" | "right" | "up" | "down") => void
  setDuration: (duration: number) => void
  setEnableProgressBar: (enable: boolean) => void
}

const PageAnimationContext = React.createContext<PageAnimationContextType | undefined>(undefined)

export interface PageAnimationProviderProps {
  children: React.ReactNode
  className?: string
  defaultTransitionType?: "basic" | "advanced"
  defaultEffect?: string
  defaultDirection?: "left" | "right" | "up" | "down"
  defaultDuration?: number
  enableProgressBar?: boolean
  reducedMotion?: boolean
}

export const PageAnimationProvider = React.forwardRef<HTMLDivElement, PageAnimationProviderProps>(
  ({ 
    children,
    className,
    defaultTransitionType = "basic",
    defaultEffect = "mixed",
    defaultDirection = "right", 
    defaultDuration = 0.3,
    enableProgressBar = true,
    reducedMotion = false,
    ...props
  }, ref) => {
    const [transitionType, setTransitionType] = React.useState<"basic" | "advanced">(defaultTransitionType)
    const [effect, setEffect] = React.useState(defaultEffect)
    const [direction, setDirection] = React.useState<"left" | "right" | "up" | "down">(defaultDirection)
    const [duration, setDuration] = React.useState(defaultDuration)
    const [enableProgressBarState, setEnableProgressBar] = React.useState(enableProgressBar)

    // Detect user's motion preferences
    const prefersReducedMotion = React.useRef(false)

    React.useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.current = mediaQuery.matches
      
      const handleChange = () => {
        prefersReducedMotion.current = mediaQuery.matches
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const contextValue: PageAnimationContextType = {
      transitionType,
      effect,
      direction,
      duration: reducedMotion || prefersReducedMotion.current ? 0.1 : duration,
      enableProgressBar: enableProgressBarState && !reducedMotion && !prefersReducedMotion.current,
      setTransitionType,
      setEffect,
      setDirection,
      setDuration,
      setEnableProgressBar
    }

    const TransitionComponent = transitionType === "advanced" ? AdvancedPageTransition : PageTransition

    return (
      <PageAnimationContext.Provider value={contextValue}>
        <MotionConfig 
          reducedMotion={reducedMotion || prefersReducedMotion.current ? "always" : "never"}
          transition={{ duration: contextValue.duration }}
        >
          <div ref={ref} className={cn("relative", className)} {...props}>
            {/* Route Progress Bar */}
            {contextValue.enableProgressBar && (
              <RouteProgress
                color="bg-blue-500"
                height={3}
                duration={contextValue.duration * 2}
                position="top"
              />
            )}
            
            {/* Page Transitions */}
            <TransitionComponent
              type={effect as any}
              effect={effect as any}
              direction={contextValue.direction}
              duration={contextValue.duration}
            >
              {children}
            </TransitionComponent>
          </div>
        </MotionConfig>
      </PageAnimationContext.Provider>
    )
  }
)

PageAnimationProvider.displayName = "PageAnimationProvider"

// Hook to use page animation context
export const usePageAnimation = () => {
  const context = React.useContext(PageAnimationContext)
  if (context === undefined) {
    throw new Error('usePageAnimation must be used within a PageAnimationProvider')
  }
  return context
}

// Hook to temporarily change transition settings
export const useTemporaryTransition = () => {
  const context = usePageAnimation()
  
  const setTemporaryTransition = React.useCallback((
    settings: Partial<Pick<PageAnimationContextType, 'transitionType' | 'effect' | 'direction' | 'duration'>>,
    restoreAfter = 1000
  ) => {
    const originalSettings = {
      transitionType: context.transitionType,
      effect: context.effect,
      direction: context.direction,
      duration: context.duration
    }

    // Apply temporary settings
    if (settings.transitionType) context.setTransitionType(settings.transitionType)
    if (settings.effect) context.setEffect(settings.effect)
    if (settings.direction) context.setDirection(settings.direction)  
    if (settings.duration) context.setDuration(settings.duration)

    // Restore original settings after timeout
    const timeoutId = setTimeout(() => {
      context.setTransitionType(originalSettings.transitionType)
      context.setEffect(originalSettings.effect)
      context.setDirection(originalSettings.direction)
      context.setDuration(originalSettings.duration)
    }, restoreAfter)

    return () => clearTimeout(timeoutId)
  }, [context])

  return { setTemporaryTransition }
}
