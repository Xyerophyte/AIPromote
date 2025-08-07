import React from 'react'
import { Skeleton } from './skeleton'
import { cn } from '@/lib/utils'

interface FormSkeletonProps {
  className?: string
  fields?: number
  includeButtons?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

export function FormSkeleton({ 
  className, 
  fields = 3, 
  includeButtons = true,
  variant = 'default'
}: FormSkeletonProps) {
  const renderField = (index: number) => {
    const isLast = index === fields - 1
    
    if (variant === 'compact') {
      return (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      )
    }

    if (variant === 'detailed') {
      return (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={cn(
            "w-full",
            isLast && fields > 2 ? "h-20" : "h-10"
          )} />
          <Skeleton className="h-3 w-32" />
        </div>
      )
    }

    // Default variant
    return (
      <div key={index} className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className={cn(
          "w-full",
          isLast && fields > 2 ? "h-16" : "h-10"
        )} />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Form title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-6">
        {Array.from({ length: fields }, (_, index) => renderField(index))}
      </div>

      {/* Buttons skeleton */}
      {includeButtons && (
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  )
}

interface InputSkeletonProps {
  className?: string
  hasLabel?: boolean
  hasError?: boolean
}

export function InputSkeleton({ className, hasLabel = true, hasError = false }: InputSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {hasLabel && <Skeleton className="h-4 w-20" />}
      <Skeleton className="h-10 w-full" />
      {hasError && <Skeleton className="h-3 w-32" />}
    </div>
  )
}

interface TextareaSkeletonProps {
  className?: string
  hasLabel?: boolean
  hasError?: boolean
  rows?: number
}

export function TextareaSkeleton({ 
  className, 
  hasLabel = true, 
  hasError = false,
  rows = 4 
}: TextareaSkeletonProps) {
  const height = rows * 16 + 24 // Approximate height calculation
  
  return (
    <div className={cn("space-y-2", className)}>
      {hasLabel && <Skeleton className="h-4 w-20" />}
      <Skeleton className="w-full" style={{ height: `${height}px` }} />
      {hasError && <Skeleton className="h-3 w-32" />}
    </div>
  )
}

interface SelectSkeletonProps {
  className?: string
  hasLabel?: boolean
  hasError?: boolean
}

export function SelectSkeleton({ className, hasLabel = true, hasError = false }: SelectSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {hasLabel && <Skeleton className="h-4 w-20" />}
      <Skeleton className="h-10 w-full" />
      {hasError && <Skeleton className="h-3 w-32" />}
    </div>
  )
}

interface CheckboxSkeletonProps {
  className?: string
  hasLabel?: boolean
  count?: number
}

export function CheckboxSkeleton({ className, hasLabel = true, count = 1 }: CheckboxSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {hasLabel && <Skeleton className="h-4 w-20 mb-3" />}
      <div className="space-y-2">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface ButtonSkeletonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function ButtonSkeleton({ 
  className, 
  variant = 'default',
  size = 'default' 
}: ButtonSkeletonProps) {
  const sizeClasses = {
    default: "h-10 w-20",
    sm: "h-9 w-16",
    lg: "h-12 w-24",
  }

  return <Skeleton className={cn(sizeClasses[size], className)} />
}

// Staggered animation skeleton for form fields
interface StaggeredFormSkeletonProps {
  className?: string
  fields?: number
}

export function StaggeredFormSkeleton({ className, fields = 4 }: StaggeredFormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }, (_, index) => (
        <div 
          key={index} 
          className="space-y-2 animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
