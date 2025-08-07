'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
  duration?: number
  delay?: number
  showPercentage?: boolean
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500', 
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500'
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  indicatorClassName,
  duration = 1.5,
  delay = 0,
  showPercentage = false,
  color = 'blue'
}: AnimatedProgressProps) {
  const [isVisible, setIsVisible] = useState(false)
  const controls = useAnimation()
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
      controls.start({
        width: `${percentage}%`,
        transition: { duration, delay, ease: 'easeOut' }
      })
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [percentage, controls, duration, delay])

  return (
    <div className={cn('relative', className)}>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClasses[color], indicatorClassName)}
          initial={{ width: '0%' }}
          animate={controls}
        />
      </div>
      {showPercentage && (
        <motion.div
          className="absolute -top-8 right-0 text-sm font-medium text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: delay + duration / 2, duration: 0.3 }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  )
}

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  color?: string
  backgroundColor?: string
  duration?: number
  delay?: number
  showPercentage?: boolean
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  duration = 1.5,
  delay = 0,
  showPercentage = true
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animate the value over duration
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        
        // Ease out function
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentValue = easeOut * percentage
        
        setAnimatedValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [percentage, duration, delay])

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </svg>
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.4 }}
        >
          <span className="text-2xl font-bold text-gray-700">
            {Math.round(animatedValue)}%
          </span>
        </motion.div>
      )}
    </div>
  )
}

// Gauge component for dashboard metrics
interface AnimatedGaugeProps {
  value: number
  max?: number
  min?: number
  label?: string
  className?: string
  size?: number
  colors?: string[]
}

export function AnimatedGauge({
  value,
  max = 100,
  min = 0,
  label,
  className,
  size = 150,
  colors = ['#ef4444', '#f59e0b', '#10b981']
}: AnimatedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(min)
  const percentage = ((value - min) / (max - min)) * 100
  const radius = size / 2 - 20
  const centerX = size / 2
  const centerY = size / 2
  
  // Calculate angle (-90 to 90 degrees for semicircle)
  const angle = -90 + (percentage / 100) * 180
  const radians = (angle * Math.PI) / 180
  
  const needleX = centerX + radius * 0.8 * Math.cos(radians)
  const needleY = centerY + radius * 0.8 * Math.sin(radians)

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 1500, 1)
        
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentValue = min + easeOut * (value - min)
        
        setAnimatedValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }, 200)

    return () => clearTimeout(timer)
  }, [value, min])

  const getColor = (percentage: number) => {
    if (percentage < 33) return colors[0]
    if (percentage < 66) return colors[1]
    return colors[2]
  }

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Colored segments */}
        {colors.map((color, index) => {
          const startAngle = -90 + (index * 60)
          const endAngle = -90 + ((index + 1) * 60)
          const startRadians = (startAngle * Math.PI) / 180
          const endRadians = (endAngle * Math.PI) / 180
          
          const x1 = centerX + radius * Math.cos(startRadians)
          const y1 = centerY + radius * Math.sin(startRadians)
          const x2 = centerX + radius * Math.cos(endRadians)
          const y2 = centerY + radius * Math.sin(endRadians)
          
          return (
            <path
              key={index}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              opacity={0.3}
            />
          )
        })}
        
        {/* Needle */}
        <motion.line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={getColor(percentage)}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ x2: centerX, y2: centerY }}
          animate={{ x2: needleX, y2: needleY }}
          transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
        />
        
        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill={getColor(percentage)}
        />
      </svg>
      
      <motion.div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="text-2xl font-bold text-gray-800">
          {Math.round(animatedValue)}
        </div>
        {label && <div className="text-sm text-gray-600 mt-1">{label}</div>}
      </motion.div>
    </div>
  )
}
