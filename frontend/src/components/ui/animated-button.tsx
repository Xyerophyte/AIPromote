"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAnimationSettings } from "@/hooks/useReducedMotion"

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "icon" | "loading" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  rippleColor?: string
  glowColor?: string
  children?: React.ReactNode
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "default", 
    loading = false,
    loadingText = "Loading...",
    leftIcon,
    rightIcon,
    rippleColor = "rgba(255, 255, 255, 0.6)",
    glowColor = "rgba(59, 130, 246, 0.4)",
    children, 
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const { prefersReducedMotion, spring } = useAnimationSettings()
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    
    React.useImperativeHandle(ref, () => buttonRef.current!, [])

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return
      
      // Skip ripple effect if reduced motion is preferred
      if (!prefersReducedMotion) {
        const button = buttonRef.current
        if (button) {
          const rect = button.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          
          const newRipple = { id: Date.now(), x, y }
          setRipples(prev => [...prev, newRipple])
          
          setTimeout(() => {
            setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
          }, 600)
        }
      }
      
      onClick?.(e)
    }, [disabled, loading, onClick, prefersReducedMotion])

    const baseClasses = cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium",
      "transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "overflow-hidden",
      "transform-gpu will-change-transform",
      // Prevent text selection
      "select-none"
    )
    
    const variantClasses = {
      primary: cn(
        "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white",
        "relative before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:translate-x-[-100%] hover:before:translate-x-[100%]",
        "before:transition-transform before:duration-700 before:ease-out",
        "hover:shadow-xl hover:shadow-blue-500/25",
        "focus-visible:ring-blue-500",
        "active:scale-95"
      ),
      secondary: cn(
        "border-2 border-gray-300 bg-white text-gray-700",
        "hover:border-gray-400 hover:bg-gray-50",
        "hover:shadow-lg hover:shadow-gray-200/50",
        "focus-visible:ring-gray-500",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95"
      ),
      icon: cn(
        "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full",
        "hover:from-indigo-600 hover:to-purple-700",
        "hover:shadow-lg hover:shadow-indigo-500/25",
        "focus-visible:ring-indigo-500",
        "transition-all duration-300",
        "hover:scale-110 active:scale-95"
      ),
      loading: cn(
        "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
        "hover:from-emerald-600 hover:to-teal-700",
        "hover:shadow-lg hover:shadow-emerald-500/25",
        "focus-visible:ring-emerald-500",
        "relative overflow-hidden"
      ),
      ghost: cn(
        "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        "focus-visible:ring-gray-500",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95"
      ),
      outline: cn(
        "border-2 border-blue-500 text-blue-600 bg-transparent",
        "hover:bg-blue-500 hover:text-white hover:border-blue-600",
        "hover:shadow-lg hover:shadow-blue-500/25",
        "focus-visible:ring-blue-500",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95"
      ),
    }
    
    const sizeClasses = {
      default: "h-11 px-6 py-2 text-base",
      sm: "h-9 px-4 text-sm",
      lg: "h-13 px-8 text-lg",
      icon: "h-11 w-11",
    }

    const buttonClassName = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      loading && "cursor-wait",
      className
    )

    // Loading Spinner Component
    const LoadingSpinner = () => (
      <motion.div 
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {loadingText && <span>{loadingText}</span>}
      </motion.div>
    )

    // Icon Animation Wrapper
    const AnimatedIcon: React.FC<{ 
      children: React.ReactNode; 
      variant: "rotate" | "pulse"; 
      className?: string 
    }> = ({ children, variant: iconVariant, className }) => {
      const iconAnimation = iconVariant === "rotate" 
        ? { 
            rotate: [0, 360],
            transition: { duration: 2, repeat: Infinity, ease: "linear" as const }
          }
        : { 
            scale: [1, 1.2, 1],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
          }

      return (
        <motion.span 
          className={className}
          animate={iconAnimation}
          whileHover={{ scale: 1.1 }}
        >
          {children}
        </motion.span>
      )
    }

    const ButtonContent = () => {
      if (loading) {
        return <LoadingSpinner />
      }

      // Simplified content for reduced motion
      if (prefersReducedMotion) {
        return (
          <>
            {leftIcon && (
              <span className={cn(children && "mr-2")}>
                {leftIcon}
              </span>
            )}
            {children && <span>{children}</span>}
            {rightIcon && (
              <span className={cn(children && "ml-2")}>
                {rightIcon}
              </span>
            )}
          </>
        )
      }

      return (
        <>
          <AnimatePresence mode="wait">
            {leftIcon && (
              <motion.span 
                className={cn(
                  "transition-transform duration-300",
                  children && "mr-2"
                )}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {variant === "icon" ? (
                  <AnimatedIcon variant="rotate">
                    {leftIcon}
                  </AnimatedIcon>
                ) : (
                  leftIcon
                )}
              </motion.span>
            )}
          </AnimatePresence>
          
          {children && (
            <motion.span 
              className="relative"
              whileHover={variant === "primary" ? { y: -1 } : {}}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.span>
          )}
          
          <AnimatePresence mode="wait">
            {rightIcon && (
              <motion.span 
                className={cn(
                  "transition-transform duration-300",
                  children && "ml-2"
                )}
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {variant === "icon" ? (
                  <AnimatedIcon variant="pulse">
                    {rightIcon}
                  </AnimatedIcon>
                ) : (
                  rightIcon
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )
    }

    // For reduced motion, use regular button
    if (prefersReducedMotion) {
      return (
        <button
          ref={buttonRef}
          className={buttonClassName}
          disabled={disabled || loading}
          onClick={handleClick}
          style={{
            '--glow-color': glowColor
          } as React.CSSProperties}
          {...props}
        >
          <ButtonContent />
        </button>
      )
    }

    return (
      <motion.button
        ref={buttonRef}
        className={buttonClassName}
        disabled={disabled || loading}
        onClick={handleClick}
        whileHover={{ 
          scale: variant === "icon" ? 1.1 : 1.02,
          boxShadow: variant === "primary" 
            ? `0 8px 25px ${glowColor}` 
            : undefined
        }}
        whileTap={{ scale: 0.95 }}
        transition={spring}
        style={{
          '--glow-color': glowColor,
          willChange: "transform, box-shadow"
        } as React.CSSProperties}
        {...props}
      >
        <ButtonContent />
        
        {/* Ripple Effects - only if motion is enabled */}
        {!prefersReducedMotion && (
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  backgroundColor: rippleColor,
                  willChange: "transform, opacity"
                }}
                initial={{ 
                  width: 0, 
                  height: 0, 
                  x: 0, 
                  y: 0, 
                  opacity: 0.6 
                }}
                animate={{ 
                  width: 300, 
                  height: 300, 
                  x: -150, 
                  y: -150, 
                  opacity: 0 
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut" 
                }}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Loading Progress Bar for Loading Variant */}
        {variant === "loading" && loading && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        )}

        {/* Shine Effect for Primary Button */}
        {variant === "primary" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        )}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"

export { AnimatedButton }
