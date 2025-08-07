"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { X, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

// Drawer placement options
type DrawerPlacement = "top" | "bottom" | "left" | "right"

// Drawer size options
type DrawerSize = "sm" | "md" | "lg" | "xl" | "full"

// Drawer animations based on placement
const getDrawerVariants = (placement: DrawerPlacement) => {
  const baseVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const slideVariants = {
    top: {
      initial: { y: "-100%" },
      animate: { y: 0 },
      exit: { y: "-100%" },
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
  }

  return {
    backdrop: baseVariants,
    content: {
      ...baseVariants,
      ...slideVariants[placement],
      initial: {
        ...baseVariants.initial,
        ...slideVariants[placement].initial,
      },
      animate: {
        ...baseVariants.animate,
        ...slideVariants[placement].animate,
        transition: {
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1], // Custom smooth easing
        },
      },
      exit: {
        ...baseVariants.exit,
        ...slideVariants[placement].exit,
        transition: {
          duration: 0.25,
          ease: [0.4, 0, 1, 1],
        },
      },
    },
  }
}

// Drawer sizes based on placement
const getDrawerSizes = (placement: DrawerPlacement, size: DrawerSize) => {
  const isVertical = placement === "top" || placement === "bottom"
  
  if (isVertical) {
    const heights = {
      sm: "h-1/4",
      md: "h-2/5", 
      lg: "h-3/5",
      xl: "h-4/5",
      full: "h-full",
    }
    return `w-full ${heights[size]}`
  } else {
    const widths = {
      sm: "w-80",
      md: "w-96",
      lg: "w-[32rem]",
      xl: "w-[48rem]",
      full: "w-full",
    }
    return `h-full ${widths[size]}`
  }
}

// Get positioning classes
const getDrawerPosition = (placement: DrawerPlacement) => {
  const positions = {
    top: "top-0 left-0 right-0",
    bottom: "bottom-0 left-0 right-0",
    left: "top-0 bottom-0 left-0",
    right: "top-0 bottom-0 right-0",
  }
  return positions[placement]
}

// Drawer Root
const Drawer = DialogPrimitive.Root

// Drawer Trigger
const DrawerTrigger = DialogPrimitive.Trigger

// Drawer Portal
const DrawerPortal = DialogPrimitive.Portal

// Drawer Overlay with backdrop animation
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    placement?: DrawerPlacement
  }
>(({ className, placement = "right", ...props }, ref) => {
  const variants = getDrawerVariants(placement)
  
  return (
    <DialogPrimitive.Overlay ref={ref} asChild {...props}>
      <motion.div
        variants={variants.backdrop}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
          className
        )}
      />
    </DialogPrimitive.Overlay>
  )
})
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName

// Drawer Content with slide animations
interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  placement?: DrawerPlacement
  size?: DrawerSize
  showHandle?: boolean
  onDragClose?: boolean
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ 
  className, 
  children, 
  placement = "right",
  size = "md",
  showHandle = false,
  onDragClose = true,
  ...props 
}, ref) => {
  const variants = getDrawerVariants(placement)
  const sizeClasses = getDrawerSizes(placement, size)
  const positionClasses = getDrawerPosition(placement)
  const isVertical = placement === "top" || placement === "bottom"
  
  // Drag to close functionality
  const [dragOffset, setDragOffset] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false)
    setDragOffset(0)
    
    if (!onDragClose) return
    
    const threshold = 100 // pixels
    const velocity = isVertical ? info.velocity.y : info.velocity.x
    const offset = isVertical ? info.offset.y : info.offset.x
    
    const shouldClose = 
      Math.abs(offset) > threshold || 
      Math.abs(velocity) > 500
    
    if (shouldClose) {
      // Close the drawer
      const closeButton = document.querySelector('[data-drawer-close]') as HTMLElement
      closeButton?.click()
    }
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (!onDragClose) return
    
    setIsDragging(true)
    const offset = isVertical ? info.offset.y : info.offset.x
    
    // Only allow dragging in the close direction
    if (placement === "right" && offset > 0) setDragOffset(offset)
    if (placement === "left" && offset < 0) setDragOffset(Math.abs(offset))
    if (placement === "top" && offset < 0) setDragOffset(Math.abs(offset))
    if (placement === "bottom" && offset > 0) setDragOffset(offset)
  }

  return (
    <DrawerPortal>
      <DrawerOverlay placement={placement} />
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          variants={variants.content}
          initial="initial"
          animate="animate"
          exit="exit"
          drag={onDragClose}
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{
            [placement === "right" ? "x" : placement === "left" ? "x" : placement === "top" ? "y" : "y"]: 
              isDragging ? dragOffset : 0
          }}
          className={cn(
            "fixed z-50 bg-background shadow-lg focus:outline-none",
            "border-border",
            positionClasses,
            sizeClasses,
            // Border styles based on placement
            placement === "top" && "border-b",
            placement === "bottom" && "border-t",
            placement === "left" && "border-r",
            placement === "right" && "border-l",
            className
          )}
        >
          {/* Drag Handle */}
          {showHandle && (
            <div className={cn(
              "flex justify-center py-2",
              isVertical ? "px-4" : "py-4"
            )}>
              <div className={cn(
                "rounded-full bg-muted",
                isVertical ? "h-1 w-8" : "w-1 h-8"
              )}>
                <GripHorizontal className={cn(
                  "text-muted-foreground opacity-40",
                  isVertical ? "h-4 w-4 rotate-90" : "h-4 w-4"
                )} />
              </div>
            </div>
          )}
          
          {children}
          
          {/* Close Button */}
          <DialogPrimitive.Close asChild data-drawer-close>
            <button
              className={cn(
                "absolute rounded-sm opacity-70 ring-offset-background transition-all duration-200",
                "hover:opacity-100 hover:scale-110 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:pointer-events-none",
                // Position close button based on drawer placement
                placement === "top" && "right-4 top-4",
                placement === "bottom" && "right-4 bottom-4",
                placement === "left" && "right-4 top-4",
                placement === "right" && "left-4 top-4"
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = DialogPrimitive.Content.displayName

// Drawer Header
const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left p-6 pb-0",
      className
    )}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

// Drawer Footer
const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0",
      className
    )}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

// Drawer Title
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DialogPrimitive.Title.displayName

// Drawer Description
const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DialogPrimitive.Description.displayName

// Drawer Body
const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 p-6", className)}
    {...props}
  />
)
DrawerBody.displayName = "DrawerBody"

// Drawer Hook for programmatic usage
interface UseDrawerReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const useDrawer = (defaultOpen = false): UseDrawerReturn => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])

  return { isOpen, open, close, toggle }
}

// Animated Drawer Wrapper
interface AnimatedDrawerProps extends DrawerContentProps {
  isOpen: boolean
  onClose?: () => void
  children: React.ReactNode
}

const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isOpen,
  onClose,
  children,
  ...props
}) => (
  <Drawer open={isOpen} onOpenChange={onClose}>
    <AnimatePresence mode="wait">
      {isOpen && (
        <DrawerContent {...props}>
          {children}
        </DrawerContent>
      )}
    </AnimatePresence>
  </Drawer>
)

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerOverlay,
  AnimatedDrawer,
  useDrawer,
  type DrawerPlacement,
  type DrawerSize,
  type DrawerContentProps,
}
