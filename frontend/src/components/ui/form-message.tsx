import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

const messageVariants = cva(
  "flex items-start gap-2 text-sm rounded-md p-3 animate-in fade-in-50 duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-4 data-[state=closed]:duration-200",
  {
    variants: {
      variant: {
        default: "bg-gray-50 text-gray-900 border border-gray-200",
        error: "bg-red-50 text-red-900 border border-red-200",
        success: "bg-green-50 text-green-900 border border-green-200",
        warning: "bg-yellow-50 text-yellow-900 border border-yellow-200",
        info: "bg-blue-50 text-blue-900 border border-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface FormMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageVariants> {
  title?: string
  dismissible?: boolean
  icon?: React.ReactNode
  visible?: boolean
  onDismiss?: () => void
}

export function FormMessage({
  className,
  variant,
  title,
  dismissible = false,
  icon,
  visible = true,
  onDismiss,
  children,
  ...props
}: FormMessageProps) {
  const [isVisible, setIsVisible] = React.useState(visible)
  const [isDismissing, setIsDismissing] = React.useState(false)
  
  // Handle visibility changes from props
  React.useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  // Handle manual dismiss
  const handleDismiss = () => {
    setIsDismissing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsDismissing(false)
      onDismiss?.()
    }, 200) // Match duration of fade-out animation
  }

  if (!isVisible) return null

  // Default icons based on variant
  const getDefaultIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
      default:
        return null
    }
  }

  const displayIcon = icon ?? getDefaultIcon()

  return (
    <div
      className={cn(messageVariants({ variant }), className)}
      data-state={isDismissing ? "closed" : "open"}
      {...props}
    >
      {displayIcon && displayIcon}
      
      <div className="flex-1">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div>{children}</div>
      </div>
      
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-900 rounded-full p-1 -m-1 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Dismiss message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Form success message with animation
export function FormSuccess({
  className,
  title = "Success",
  children,
  ...props
}: Omit<FormMessageProps, "variant">) {
  return (
    <FormMessage
      variant="success"
      title={title}
      className={cn("animate-slide-up", className)}
      {...props}
    >
      {children}
    </FormMessage>
  )
}

// Form error message with animation
export function FormError({
  className,
  title = "Error",
  children,
  ...props
}: Omit<FormMessageProps, "variant">) {
  return (
    <FormMessage
      variant="error"
      title={title}
      className={cn("animate-slide-up", className)}
      {...props}
    >
      {children}
    </FormMessage>
  )
}

// Form warning message with animation
export function FormWarning({
  className,
  title = "Warning",
  children,
  ...props
}: Omit<FormMessageProps, "variant">) {
  return (
    <FormMessage
      variant="warning"
      title={title}
      className={cn("animate-slide-up", className)}
      {...props}
    >
      {children}
    </FormMessage>
  )
}

// Form info message with animation
export function FormInfo({
  className,
  title = "Info",
  children,
  ...props
}: Omit<FormMessageProps, "variant">) {
  return (
    <FormMessage
      variant="info"
      title={title}
      className={cn("animate-slide-up", className)}
      {...props}
    >
      {children}
    </FormMessage>
  )
}
