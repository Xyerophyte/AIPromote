'use client'

import { useEffect, useRef, useState } from 'react'

interface UseLazyAnimationOptions {
  threshold?: number
  triggerOnce?: boolean
}

interface UseLazyAnimationReturn {
  ref: React.RefObject<HTMLElement>
  shouldAnimate: boolean
  isVisible: boolean
}

/**
 * Custom hook for lazy loading animations when elements become visible
 * @param options Configuration options
 * @returns Object containing ref, shouldAnimate, and isVisible states
 */
export function useLazyAnimation(options: UseLazyAnimationOptions = {}): UseLazyAnimationReturn {
  const { threshold = 0.1, triggerOnce = false } = options
  const ref = useRef<HTMLElement>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        
        setIsVisible(isIntersecting)
        
        if (isIntersecting) {
          setShouldAnimate(true)
          
          // If triggerOnce is true, unobserve after first intersection
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          // Only reset if not triggerOnce
          setShouldAnimate(false)
        }
      },
      {
        threshold,
        rootMargin: '50px'
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [threshold, triggerOnce])

  return {
    ref,
    shouldAnimate,
    isVisible
  }
}
