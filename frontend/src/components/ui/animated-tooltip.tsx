'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedTooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
  contentClassName?: string
  arrow?: boolean
  disabled?: boolean
}

export function AnimatedTooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
  contentClassName,
  arrow = true,
  disabled = false
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      
      // Auto-adjust position based on viewport
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight
        }
        
        let newPosition = position
        
        if (position === 'top' && rect.top < 60) {
          newPosition = 'bottom'
        } else if (position === 'bottom' && rect.bottom > viewport.height - 60) {
          newPosition = 'top'
        } else if (position === 'left' && rect.left < 200) {
          newPosition = 'right'
        } else if (position === 'right' && rect.right > viewport.width - 200) {
          newPosition = 'left'
        }
        
        setActualPosition(newPosition)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const getAnimationVariants = () => {
    const variants = {
      hidden: {
        opacity: 0,
        scale: 0.95,
        y: 0,
        x: 0
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0
      }
    }

    switch (actualPosition) {
      case 'top':
        variants.hidden.y = 8
        variants.visible.y = 0
        break
      case 'bottom':
        variants.hidden.y = -8
        variants.visible.y = 0
        break
      case 'left':
        variants.hidden.x = 8
        variants.visible.x = 0
        break
      case 'right':
        variants.hidden.x = -8
        variants.visible.x = 0
        break
    }

    return variants
  }

  const getPositionClasses = () => {
    switch (actualPosition) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (actualPosition) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900'
    }
  }

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap max-w-xs',
              getPositionClasses(),
              contentClassName
            )}
            variants={getAnimationVariants()}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              duration: 0.2,
              ease: 'easeOut'
            }}
          >
            {content}
            
            {arrow && (
              <div
                className={cn(
                  'absolute w-0 h-0 border-4',
                  getArrowClasses()
                )}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Statistics card with animated tooltip
interface StatCardWithTooltipProps {
  title: string
  value: number
  change?: number
  changeLabel?: string
  icon: ReactNode
  color?: string
  tooltip?: string
  className?: string
}

export function StatCardWithTooltip({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'blue',
  tooltip,
  className
}: StatCardWithTooltipProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  }

  const changeColor = change && change > 0 ? 'text-green-600' : change && change < 0 ? 'text-red-600' : 'text-gray-600'

  return (
    <motion.div
      className={cn('bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <AnimatedTooltip
            content={tooltip || `${title}: ${value.toLocaleString()}`}
            position="top"
            disabled={!tooltip}
          >
            <p className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
              {title}
            </p>
          </AnimatedTooltip>
          
          <motion.p
            className="text-2xl font-bold text-gray-900 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {value.toLocaleString()}
          </motion.p>
        </div>
        
        <motion.div
          className={cn('p-3 rounded-lg', colorClasses[color as keyof typeof colorClasses])}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {icon}
        </motion.div>
      </div>
      
      {change !== undefined && (
        <motion.div
          className="flex items-center gap-1 mt-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <AnimatedTooltip
            content={changeLabel || `${change > 0 ? 'Increase' : 'Decrease'} of ${Math.abs(change)}% from last period`}
            position="bottom"
          >
            <span className={cn('text-sm font-medium flex items-center gap-1', changeColor)}>
              {change > 0 && '+'}
              {change}%
              <span className="text-gray-500 font-normal">from last period</span>
            </span>
          </AnimatedTooltip>
        </motion.div>
      )}
    </motion.div>
  )
}
