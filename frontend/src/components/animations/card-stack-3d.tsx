"use client"

import React, { useState, useRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/components/animations/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface Card {
  id: string
  title: string
  content: string
  color?: string
  image?: string
}

interface CardStack3DProps {
  cards: Card[]
  className?: string
  maxVisible?: number
  stackOffset?: number
  scaleStep?: number
  onCardChange?: (index: number) => void
}

export function CardStack3D({
  cards,
  className,
  maxVisible = 3,
  stackOffset = 10,
  scaleStep = 0.05,
  onCardChange
}: CardStack3DProps) {
  const prefersReducedMotion = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [draggedCard, setDraggedCard] = useState<number | null>(null)
  
  const dragX = useMotionValue(0)
  const dragRotation = useTransform(dragX, [-200, 200], [-25, 25])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100
    
    if (Math.abs(info.offset.x) > threshold) {
      // Swipe detected
      if (info.offset.x > 0) {
        // Swiped right - go to previous card
        setCurrentIndex(prev => prev > 0 ? prev - 1 : cards.length - 1)
      } else {
        // Swiped left - go to next card  
        setCurrentIndex(prev => prev < cards.length - 1 ? prev + 1 : 0)
      }
      onCardChange?.(currentIndex)
    }
    
    setDraggedCard(null)
    dragX.set(0)
  }

  const getCardStyle = (index: number) => {
    const relativeIndex = (index - currentIndex + cards.length) % cards.length
    const isVisible = relativeIndex < maxVisible
    
    if (!isVisible) {
      return {
        opacity: 0,
        scale: 0.8,
        y: stackOffset * maxVisible,
        zIndex: 0,
        rotateY: 0
      }
    }

    const scale = 1 - (relativeIndex * scaleStep)
    const y = relativeIndex * stackOffset
    const opacity = 1 - (relativeIndex * 0.2)
    const zIndex = maxVisible - relativeIndex
    const rotateY = prefersReducedMotion ? 0 : relativeIndex * 5

    return {
      scale,
      y,
      opacity,
      zIndex,
      rotateY
    }
  }

  const colors = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-blue-600', 
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600'
  ]

  if (prefersReducedMotion) {
    return (
      <div className={cn("relative w-full max-w-sm mx-auto", className)}>
        <div className="bg-white rounded-2xl shadow-xl p-6 border">
          <h3 className="text-xl font-bold mb-3 text-gray-900">
            {cards[currentIndex]?.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {cards[currentIndex]?.content}
          </p>
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                onCardChange?.(index)
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex ? "bg-blue-500" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full max-w-sm mx-auto perspective-1000", className)}>
      <div className="relative h-80" style={{ perspective: '1000px' }}>
        {cards.map((card, index) => {
          const style = getCardStyle(index)
          const colorClass = colors[index % colors.length]
          
          return (
            <motion.div
              key={card.id}
              className={cn(
                "absolute inset-0 rounded-2xl shadow-xl overflow-hidden",
                "cursor-grab active:cursor-grabbing will-change-transform",
                `bg-gradient-to-br ${colorClass}`
              )}
              style={{
                zIndex: style.zIndex,
                ...(draggedCard === index && { 
                  rotate: dragRotation,
                  x: dragX 
                })
              }}
              initial={false}
              animate={draggedCard !== index ? {
                scale: style.scale,
                y: style.y,
                opacity: style.opacity,
                rotateY: style.rotateY,
                rotateX: 0
              } : undefined}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25
              }}
              drag={index === currentIndex ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragStart={() => setDraggedCard(index)}
              onDragEnd={handleDragEnd}
              whileHover={index === currentIndex ? {
                scale: style.scale * 1.02,
                rotateY: style.rotateY + 2
              } : undefined}
              whileTap={index === currentIndex ? {
                scale: style.scale * 0.98
              } : undefined}
            >
              {/* Card gradient overlay */}
              <div className="absolute inset-0 bg-black/10" />
              
              {/* Card content */}
              <div className="relative h-full p-6 flex flex-col justify-between text-white">
                <div>
                  <motion.h3 
                    className="text-2xl font-bold mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p 
                    className="text-white/90 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {card.content}
                  </motion.p>
                </div>
                
                {/* Card number indicator */}
                <div className="flex justify-between items-center">
                  <motion.div 
                    className="text-white/60 text-sm font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {index + 1} of {cards.length}
                  </motion.div>
                  
                  {index === currentIndex && (
                    <motion.div
                      className="w-8 h-1 bg-white/40 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    />
                  )}
                </div>
              </div>
              
              {/* Shine effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )
        })}
      </div>
      
      {/* Navigation dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {cards.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              onCardChange?.(index)
            }}
            className={cn(
              "relative w-3 h-3 rounded-full transition-all duration-200",
              index === currentIndex 
                ? "bg-blue-500 shadow-lg shadow-blue-500/40" 
                : "bg-gray-300 hover:bg-gray-400"
            )}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {index === currentIndex && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-400"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      
      {/* Swipe instructions */}
      <motion.div 
        className="text-center mt-4 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Swipe or drag to navigate
      </motion.div>
    </div>
  )
}

// Preset card data for demo
export const DEMO_CARDS: Card[] = [
  {
    id: '1',
    title: 'AI Strategy',
    content: 'Generate custom marketing strategies tailored to your startup with advanced AI algorithms and market analysis.',
  },
  {
    id: '2', 
    title: 'Content Creation',
    content: 'Create engaging posts, blogs, and marketing copy optimized for each platform with AI-powered creativity.',
  },
  {
    id: '3',
    title: 'Analytics & Insights',
    content: 'Track engagement, reach, and conversions with detailed analytics dashboards and actionable insights.',
  },
  {
    id: '4',
    title: 'Automation',
    content: 'Schedule and publish content across all your social media channels automatically with smart timing.',
  },
  {
    id: '5',
    title: 'Brand Consistency',
    content: 'Maintain consistent voice, tone, and messaging across all marketing materials with AI-powered guidelines.',
  }
]
