"use client"

import { useEffect, useState, useRef } from "react"
import { useReducedMotion } from "./useReducedMotion"

interface UseLazyAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  disabled?: boolean
}

/**
 * Hook that delays animation loading until element is visible in viewport
 * Improves performance by only loading animations when needed
 */
export function useLazyAnimation({
  threshold = 0.1,
  rootMargin = "50px",
  triggerOnce = true,
  disabled = false
}: UseLazyAnimationOptions = {}) {
  const [shouldAnimate, setShouldAnimate] = useState(disabled)
  const [isVisible, setIsVisible] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (disabled || prefersReducedMotion) {
      setShouldAnimate(false)
      return
    }

    if (!ref.current || typeof window === "undefined") {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        
        setIsVisible(isIntersecting)
        
        if (isIntersecting) {
          setShouldAnimate(true)
          if (triggerOnce) {
            observer.unobserve(entry.target)
          }
        } else if (!triggerOnce) {
          setShouldAnimate(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, disabled, prefersReducedMotion])

  return {
    ref,
    shouldAnimate: shouldAnimate && !prefersReducedMotion,
    isVisible,
    prefersReducedMotion
  }
}
