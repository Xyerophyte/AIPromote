'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface AnimatedBarChartProps {
  data: ChartDataPoint[]
  maxValue?: number
  height?: number
  className?: string
  animate?: boolean
  staggerDelay?: number
}

export function AnimatedBarChart({
  data,
  maxValue,
  height = 300,
  className,
  animate = true,
  staggerDelay = 0.1
}: AnimatedBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value))
  
  return (
    <div className={cn('w-full p-4', className)}>
      <div className="flex items-end justify-between space-x-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 40)
          const color = item.color || '#3b82f6'
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <motion.div
                className="w-full rounded-t-md relative group cursor-pointer"
                style={{ backgroundColor: color }}
                initial={{ height: 0 }}
                animate={{ height: animate ? barHeight : barHeight }}
                transition={{
                  duration: 0.8,
                  delay: animate ? index * staggerDelay : 0,
                  ease: 'easeOut'
                }}
              >
                {/* Value display on hover */}
                <motion.div
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ opacity: 0, y: 5 }}
                  whileHover={{ opacity: 1, y: 0 }}
                >
                  {item.value.toLocaleString()}
                </motion.div>
              </motion.div>
              
              <motion.div
                className="mt-2 text-xs text-gray-600 text-center font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: animate ? (index * staggerDelay) + 0.4 : 0
                }}
              >
                {item.label}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface LineChartPoint {
  x: number
  y: number
  label?: string
}

interface AnimatedLineChartProps {
  data: LineChartPoint[]
  width?: number
  height?: number
  className?: string
  strokeColor?: string
  strokeWidth?: number
  showDots?: boolean
  animate?: boolean
  staggerDelay?: number
}

export function AnimatedLineChart({
  data,
  width = 400,
  height = 200,
  className,
  strokeColor = '#3b82f6',
  strokeWidth = 2,
  showDots = true,
  animate = true,
  staggerDelay = 0.1
}: AnimatedLineChartProps) {
  const [pathLength, setPathLength] = useState(0)
  
  // Calculate the SVG path
  const maxX = Math.max(...data.map(d => d.x))
  const maxY = Math.max(...data.map(d => d.y))
  const minY = Math.min(...data.map(d => d.y))
  
  const scaleX = (value: number) => (value / maxX) * (width - 40) + 20
  const scaleY = (value: number) => height - 20 - ((value - minY) / (maxY - minY)) * (height - 40)
  
  const pathData = data
    .map((point, index) => {
      const x = scaleX(point.x)
      const y = scaleY(point.y)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  useEffect(() => {
    if (animate) {
      setPathLength(1)
    }
  }, [animate])

  return (
    <div className={cn('relative', className)}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />
        
        {/* Animated line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animate ? 1 : 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        
        {/* Animated dots */}
        {showDots && data.map((point, index) => (
          <motion.circle
            key={index}
            cx={scaleX(point.x)}
            cy={scaleY(point.y)}
            r="4"
            fill={strokeColor}
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: animate ? index * staggerDelay + 1 : 0,
              ease: 'easeOut'
            }}
            className="cursor-pointer"
            whileHover={{ scale: 1.5 }}
          >
            <title>{point.label || `Value: ${point.y}`}</title>
          </motion.circle>
        ))}
      </svg>
    </div>
  )
}

interface DonutChartProps {
  data: ChartDataPoint[]
  size?: number
  thickness?: number
  className?: string
  showLabels?: boolean
  animate?: boolean
  staggerDelay?: number
}

export function AnimatedDonutChart({
  data,
  size = 200,
  thickness = 20,
  className,
  showLabels = true,
  animate = true,
  staggerDelay = 0.2
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  
  let cumulativePercentage = 0
  
  return (
    <div className={cn('relative inline-block', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
          const strokeDashoffset = -((cumulativePercentage / 100) * circumference)
          const color = item.color || `hsl(${index * 45}, 70%, 60%)`
          
          cumulativePercentage += percentage
          
          return (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray }}
              transition={{
                duration: 1,
                delay: animate ? index * staggerDelay : 0,
                ease: 'easeOut'
              }}
              className="cursor-pointer"
              whileHover={{ strokeWidth: thickness + 2 }}
            />
          )
        })}
      </svg>
      
      {/* Center value */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center flex-col"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="text-2xl font-bold text-gray-800">
          {total.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Total</div>
      </motion.div>
      
      {/* Labels */}
      {showLabels && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full">
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {data.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-1 text-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index * staggerDelay) + 0.8, duration: 0.3 }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 60%)` }}
                />
                <span className="text-gray-600">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
