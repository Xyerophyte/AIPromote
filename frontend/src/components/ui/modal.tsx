"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Modal animations
const backdropVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  }
}

const modalVariants = {
  initial: { 
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  animate: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1], // bounce-out easing
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.6, 1],
    }
  }
}

// Modal Root
const Modal = DialogPrimitive.Root

// Modal Trigger
const ModalTrigger = DialogPrimitive.Trigger

// Modal Portal
const ModalPortal = DialogPrimitive.Portal

// Modal Overlay with backdrop blur animation
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} asChild {...props}>
    <motion.div
      variants={backdropVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
    />
  </DialogPrimitive.Overlay>
))
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName

// Modal Content with scale animations
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content ref={ref} asChild {...props}>
      <motion.div
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <button
            className={cn(
              "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all duration-200",
              "hover:opacity-100 hover:scale-110 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogPrimitive.Close>
      </motion.div>
    </DialogPrimitive.Content>
  </ModalPortal>
))
ModalContent.displayName = DialogPrimitive.Content.displayName

// Modal Header
const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
ModalHeader.displayName = "ModalHeader"

// Modal Footer
const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
ModalFooter.displayName = "ModalFooter"

// Modal Title
const ModalTitle = React.forwardRef<
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
ModalTitle.displayName = DialogPrimitive.Title.displayName

// Modal Description
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ModalDescription.displayName = DialogPrimitive.Description.displayName

// Modal Body
const ModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("py-2", className)}
    {...props}
  />
)
ModalBody.displayName = "ModalBody"

// Custom Modal Sizes
const ModalContentSizes = {
  sm: "max-w-sm",
  md: "max-w-lg", // default
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] max-h-[95vh]"
}

interface ModalContentWithSizeProps 
  extends React.ComponentPropsWithoutRef<typeof ModalContent> {
  size?: keyof typeof ModalContentSizes
}

const ModalContentWithSize = React.forwardRef<
  React.ElementRef<typeof ModalContent>,
  ModalContentWithSizeProps
>(({ className, size = "md", ...props }, ref) => (
  <ModalContent
    ref={ref}
    className={cn(ModalContentSizes[size], className)}
    {...props}
  />
))
ModalContentWithSize.displayName = "ModalContentWithSize"

// Glass Modal Variant
const GlassModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ModalPortal>
    <DialogPrimitive.Overlay ref={ref} asChild {...props}>
      <motion.div
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-50 backdrop-blur-md bg-black/20"
      />
    </DialogPrimitive.Overlay>
    <DialogPrimitive.Content ref={ref} asChild {...props}>
      <motion.div
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4",
          "bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl duration-200 sm:rounded-2xl",
          "focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2",
          className
        )}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <button
            className={cn(
              "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all duration-200",
              "hover:opacity-100 hover:scale-110 active:scale-95 text-white/80 hover:text-white",
              "focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2",
              "disabled:pointer-events-none"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogPrimitive.Close>
      </motion.div>
    </DialogPrimitive.Content>
  </ModalPortal>
))
GlassModalContent.displayName = "GlassModalContent"

// Modal Hook for programmatic usage
interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const useModal = (defaultOpen = false): UseModalReturn => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])

  return { isOpen, open, close, toggle }
}

// Animated Modal Wrapper for use with AnimatePresence
interface AnimatedModalProps {
  isOpen: boolean
  onClose?: () => void
  children: React.ReactNode
  className?: string
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  className
}) => (
  <Modal open={isOpen} onOpenChange={onClose}>
    <AnimatePresence mode="wait">
      {isOpen && (
        <ModalContent className={className}>
          {children}
        </ModalContent>
      )}
    </AnimatePresence>
  </Modal>
)

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalContentWithSize,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalOverlay,
  GlassModalContent,
  AnimatedModal,
  useModal,
}
