"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react"
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalTitle, ModalDescription } from "./modal"
import { Button } from "./button"
import { cn } from "@/lib/utils"

// Shake animation variants for destructive actions
const shakeVariants = {
  initial: { x: 0 },
  shake: {
    x: [-4, 4, -4, 4, -2, 2, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    }
  }
}

// Confirmation dialog types
interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
  loading?: boolean
  icon?: React.ReactNode
}

// Enhanced shake animation for destructive actions
const destructiveShakeVariants = {
  initial: { x: 0, scale: 1 },
  shake: {
    x: [-6, 6, -6, 6, -4, 4, -2, 2, 0],
    scale: [1, 1.02, 1, 1.02, 1, 1.01, 1],
    transition: {
      duration: 0.6,
      ease: "easeInOut",
    }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  icon
}) => {
  const [isShaking, setIsShaking] = React.useState(false)
  
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          headerBg: "bg-red-50 dark:bg-red-950/20",
          titleColor: "text-red-900 dark:text-red-100",
          descriptionColor: "text-red-700 dark:text-red-300",
          iconColor: "text-red-600",
          confirmButton: "destructive",
          defaultIcon: <AlertTriangle className="h-6 w-6" />
        }
      case "warning":
        return {
          headerBg: "bg-yellow-50 dark:bg-yellow-950/20",
          titleColor: "text-yellow-900 dark:text-yellow-100",
          descriptionColor: "text-yellow-700 dark:text-yellow-300",
          iconColor: "text-yellow-600",
          confirmButton: "default",
          defaultIcon: <AlertCircle className="h-6 w-6" />
        }
      default:
        return {
          headerBg: "bg-gray-50 dark:bg-gray-950/20",
          titleColor: "text-gray-900 dark:text-gray-100",
          descriptionColor: "text-gray-700 dark:text-gray-300",
          iconColor: "text-gray-600",
          confirmButton: "default",
          defaultIcon: <AlertCircle className="h-6 w-6" />
        }
    }
  }

  const styles = getVariantStyles()

  const handleConfirm = () => {
    if (variant === "destructive") {
      setIsShaking(true)
      // Add a small delay to show the shake animation before confirming
      setTimeout(() => {
        onConfirm()
        setIsShaking(false)
      }, 600)
    } else {
      onConfirm()
    }
  }

  const modalContentVariants = {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 10,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <ModalContent className="sm:max-w-md overflow-hidden">
            <motion.div
              variants={variant === "destructive" ? destructiveShakeVariants : shakeVariants}
              initial="initial"
              animate={isShaking ? "shake" : "initial"}
              className="space-y-4"
            >
              {/* Header with Icon */}
              <ModalHeader className={cn("pb-2", styles.headerBg, "-mx-6 -mt-6 px-6 pt-6")}>
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3, type: "spring", stiffness: 300 }}
                    className={cn("flex-shrink-0", styles.iconColor)}
                  >
                    {icon || styles.defaultIcon}
                  </motion.div>
                  <div className="flex-1">
                    <ModalTitle className={cn(styles.titleColor)}>
                      {title}
                    </ModalTitle>
                    {description && (
                      <ModalDescription className={cn("mt-1", styles.descriptionColor)}>
                        {description}
                      </ModalDescription>
                    )}
                  </div>
                </div>
              </ModalHeader>

              {/* Action Buttons */}
              <ModalFooter className="sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="sm:w-auto"
                >
                  {cancelText}
                </Button>
                <motion.div
                  whileHover="hover"
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={styles.confirmButton as any}
                    onClick={handleConfirm}
                    loading={loading}
                    disabled={loading}
                    className="sm:w-auto"
                  >
                    {confirmText}
                  </Button>
                </motion.div>
              </ModalFooter>
            </motion.div>
          </ModalContent>
        )}
      </AnimatePresence>
    </Modal>
  )
}

// Specialized Delete Confirmation Dialog
interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName?: string
  itemType?: string
  loading?: boolean
  customMessage?: string
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  loading = false,
  customMessage
}) => {
  const title = `Delete ${itemType}${itemName ? ` "${itemName}"` : ''}?`
  const description = customMessage || `This action cannot be undone. The ${itemType} will be permanently removed.`

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
      loading={loading}
      icon={<Trash2 className="h-6 w-6" />}
    />
  )
}

// Hook for confirmation dialogs
interface UseConfirmationDialogReturn {
  isOpen: boolean
  showConfirmation: (config: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => Promise<boolean>
  hideConfirmation: () => void
  ConfirmationDialog: React.FC
}

const useConfirmationDialog = (): UseConfirmationDialogReturn => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'> | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const showConfirmation = React.useCallback(
    (dialogConfig: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
      return new Promise<boolean>((resolve) => {
        setConfig(dialogConfig)
        setIsOpen(true)
        resolveRef.current = resolve
      })
    },
    []
  )

  const hideConfirmation = React.useCallback(() => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (config?.onConfirm) {
      config.onConfirm()
    }
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(true)
      resolveRef.current = null
    }
  }, [config])

  const ConfirmationDialogComponent = React.useCallback(() => {
    if (!config) return null

    return (
      <ConfirmationDialog
        {...config}
        isOpen={isOpen}
        onClose={hideConfirmation}
        onConfirm={handleConfirm}
      />
    )
  }, [config, isOpen, hideConfirmation, handleConfirm])

  return {
    isOpen,
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent,
  }
}

export {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  useConfirmationDialog,
  type ConfirmationDialogProps,
  type DeleteConfirmationDialogProps,
}
