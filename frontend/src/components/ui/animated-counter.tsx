'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  format?: (value: number) => string
}

export function AnimatedCounter({ 
  value, 
  duration = 2, 
  delay = 0,
  className = "",
  format = (val) => val.toLocaleString()
}: AnimatedCounterProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  // Use framer-motion's useSpring for smooth animation
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  })
  
  const display = useTransform(springValue, (val) => format(Math.round(val)))

  useEffect(() => {
    // Small delay to trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
      springValue.set(value)
    }, delay * 1000)
    
    return () => clearTimeout(timer)
  }, [value, springValue, delay])

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5, delay: delay }}
    >
      {display}
    </motion.span>
  )
}

// Specialized version for percentage values
export function AnimatedPercentage({
  value,
  duration = 2,
  delay = 0,
  className = "",
  showSign = true
}: Omit<AnimatedCounterProps, 'format'> & { showSign?: boolean }) {
  const format = (val: number) => `${showSign && val > 0 ? '+' : ''}${val.toFixed(1)}%`
  
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      delay={delay}
      className={className}
      format={format}
    />
  )
}
