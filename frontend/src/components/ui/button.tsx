import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "active:scale-95 hover:scale-[1.02]",
      "transform-gpu will-change-transform"
    )
    
    const variantClasses = {
      default: cn(
        "bg-slate-900 text-slate-50",
        "hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/25",
        "focus-visible:ring-slate-900",
        "active:bg-slate-950"
      ),
      destructive: cn(
        "bg-red-500 text-slate-50",
        "hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25",
        "focus-visible:ring-red-500",
        "active:bg-red-700"
      ),
      success: cn(
        "bg-green-600 text-slate-50",
        "hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/25",
        "focus-visible:ring-green-600",
        "active:bg-green-800"
      ),
      outline: cn(
        "border-2 border-slate-200 bg-white text-slate-900",
        "hover:bg-slate-50 hover:border-slate-300 hover:shadow-md",
        "focus-visible:ring-slate-900",
        "active:bg-slate-100"
      ),
      secondary: cn(
        "bg-slate-100 text-slate-900",
        "hover:bg-slate-200 hover:shadow-md",
        "focus-visible:ring-slate-900",
        "active:bg-slate-300"
      ),
      ghost: cn(
        "text-slate-900 hover:bg-slate-100",
        "focus-visible:ring-slate-900",
        "active:bg-slate-200"
      ),
      link: cn(
        "text-slate-900 underline-offset-4",
        "hover:underline focus-visible:ring-slate-900"
      ),
    }
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-xs",
      lg: "h-12 rounded-lg px-8 text-base",
      icon: "h-10 w-10",
    }
    
    const buttonClassName = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      loading && "cursor-wait",
      className
    )

    const LoadingSpinner = () => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        {loadingText && <span>{loadingText}</span>}
      </div>
    )

    const ButtonContent = () => {
      if (loading) {
        return <LoadingSpinner />
      }

      return (
        <React.Fragment>
          {leftIcon && (
            <span className={cn(
              "transition-transform duration-200",
              children && "mr-2"
            )}>
              {leftIcon}
            </span>
          )}
          {children && (
            <span className="transition-all duration-200">
              {children}
            </span>
          )}
          {rightIcon && (
            <span className={cn(
              "transition-transform duration-200",
              children && "ml-2"
            )}>
              {rightIcon}
            </span>
          )}
        </React.Fragment>
      )
    }

    if (asChild && React.isValidElement(children)) {
      const childProps = children.props as any;
      return React.cloneElement(children as any, {
        className: cn(buttonClassName, childProps?.className),
        ref,
        disabled: disabled || loading,
        ...props,
      })
    }

    return (
      <button
        className={buttonClassName}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        <ButtonContent />
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
export { AnimatedButton } from "./animated-button"
