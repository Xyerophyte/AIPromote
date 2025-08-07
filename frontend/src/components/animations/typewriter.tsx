"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface TypewriterProps {
  text: string
  className?: string
  delay?: number
  speed?: number
  cursor?: boolean
  cursorChar?: string
  onComplete?: () => void
}

const Typewriter = React.forwardRef<HTMLDivElement, TypewriterProps>(
  ({ 
    text, 
    className,
    delay = 0,
    speed = 0.05,
    cursor = true,
    cursorChar = "|",
    onComplete,
    ...props 
  }, ref) => {
    const [displayText, setDisplayText] = React.useState("")
    const [showCursor, setShowCursor] = React.useState(cursor)

    React.useEffect(() => {
      const timer = setTimeout(() => {
        let index = 0
        const interval = setInterval(() => {
          if (index <= text.length) {
            setDisplayText(text.slice(0, index))
            index++
          } else {
            clearInterval(interval)
            if (onComplete) onComplete()
            // Hide cursor after completion if desired
            setTimeout(() => setShowCursor(false), 1000)
          }
        }, speed * 1000)

        return () => clearInterval(interval)
      }, delay * 1000)

      return () => clearTimeout(timer)
    }, [text, delay, speed, onComplete])

    return (
      <motion.div
        ref={ref}
        className={cn("inline-block", className)}
        {...props}
      >
        {displayText}
        {showCursor && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="ml-1 text-blue-600"
          >
            {cursorChar}
          </motion.span>
        )}
      </motion.div>
    )
  }
)

Typewriter.displayName = "Typewriter"

export { Typewriter }
