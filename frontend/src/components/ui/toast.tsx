"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Toast Provider
const ToastProvider = ToastPrimitives.Provider

// Toast Viewport with animation
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-4 sm:top-4 sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

// Toast variant and animations
const toastVariants = {
  default: "border bg-background text-foreground",
  destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
  success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
}

const toastAnimationVariants = {
  initial: { 
    opacity: 0, 
    x: 100,
    scale: 0.8,
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: { 
    opacity: 0, 
    x: 100,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.6, 1],
    },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: keyof typeof toastVariants
    icon?: React.ReactNode
  }
>(({ className, variant = "default", icon, children, ...props }, ref) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <motion.div
      layout
      variants={toastAnimationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className="group pointer-events-auto relative flex w-full overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all"
    >
      <ToastPrimitives.Root
        ref={ref}
        className={cn(
          "relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-0 transition-all",
          toastVariants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-3">
          {icon || getDefaultIcon()}
          <div className="grid gap-1">
            {children}
          </div>
        </div>
      </ToastPrimitives.Root>
    </motion.div>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-all duration-200 hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

// Toast Container with AnimatePresence for exit animations
interface ToastContainerProps {
  children: React.ReactNode
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => (
  <AnimatePresence mode="popLayout">
    {children}
  </AnimatePresence>
)

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

// Hook for toast notifications
const useToast = () => {
  const [toasts, setToasts] = React.useState<
    Array<{
      id: string
      title?: React.ReactNode
      description?: React.ReactNode
      action?: ToastActionElement
      variant?: ToastProps["variant"]
      duration?: number
    }>
  >([])

  const addToast = React.useCallback(
    (props: {
      title?: React.ReactNode
      description?: React.ReactNode
      action?: ToastActionElement
      variant?: ToastProps["variant"]
      duration?: number
    }) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((prev) => [
        ...prev,
        {
          id,
          duration: 5000,
          ...props,
        },
      ])

      // Auto dismiss after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, props.duration || 5000)

      return id
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = React.useMemo(
    () => ({
      success: (props: Omit<Parameters<typeof addToast>[0], 'variant'>) =>
        addToast({ ...props, variant: 'success' }),
      error: (props: Omit<Parameters<typeof addToast>[0], 'variant'>) =>
        addToast({ ...props, variant: 'destructive' }),
      warning: (props: Omit<Parameters<typeof addToast>[0], 'variant'>) =>
        addToast({ ...props, variant: 'warning' }),
      info: (props: Omit<Parameters<typeof addToast>[0], 'variant'>) =>
        addToast({ ...props, variant: 'info' }),
      default: addToast,
    }),
    [addToast]
  )

  return {
    toasts,
    toast,
    removeToast,
  }
}

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastContainer,
  useToast,
}
