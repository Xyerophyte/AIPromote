"use client"

import { useEffect, useState } from "react"

/**
 * Hook to detect if user prefers reduced motion for accessibility
 * @returns boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    // Check initial preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to get optimized animation settings based on user preferences
 */
export function useAnimationSettings() {
  const prefersReducedMotion = useReducedMotion()

  return {
    prefersReducedMotion,
    duration: prefersReducedMotion ? 0.01 : 0.3,
    spring: prefersReducedMotion 
      ? { type: "tween", duration: 0.01 }
      : { type: "spring", stiffness: 300, damping: 20 },
    transition: prefersReducedMotion
      ? { duration: 0.01 }
      : { duration: 0.3, ease: "easeOut" }
  }
}
