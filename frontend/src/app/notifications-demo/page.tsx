"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Toast, 
  ToastProvider, 
  ToastViewport, 
  ToastTitle, 
  ToastDescription, 
  ToastClose,
  useToast 
} from "@/components/ui/toast"
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalTitle, 
  ModalDescription, 
  ModalTrigger,
  GlassModalContent,
  useModal 
} from "@/components/ui/modal"
import { 
  ConfirmationDialog, 
  DeleteConfirmationDialog,
  useConfirmationDialog 
} from "@/components/ui/confirmation-dialog"
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerBody,
  useDrawer,
  type DrawerPlacement 
} from "@/components/ui/drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Settings, 
  User, 
  MessageCircle, 
  FileText, 
  Download,
  Share2,
  AlertTriangle,
  Trash2,
  Edit3,
  Save,
  X
} from "lucide-react"

export default function NotificationsDemoPage() {
  // Toast Hook
  const { toasts, toast, removeToast } = useToast()

  // Modal Hooks
  const basicModal = useModal()
  const glassModal = useModal()

  // Confirmation Dialog Hook
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  // Drawer Hooks
  const rightDrawer = useDrawer()
  const leftDrawer = useDrawer()
  const topDrawer = useDrawer()
  const bottomDrawer = useDrawer()

  // Toast Handlers
  const showSuccessToast = () => {
    toast.success({
      title: "Success!",
      description: "Your action was completed successfully.",
      duration: 4000
    })
  }

  const showErrorToast = () => {
    toast.error({
      title: "Error occurred",
      description: "Something went wrong. Please try again.",
      duration: 5000
    })
  }

  const showWarningToast = () => {
    toast.warning({
      title: "Warning",
      description: "Please review your settings before continuing.",
      duration: 4000
    })
  }

  const showInfoToast = () => {
    toast.info({
      title: "New update available",
      description: "Version 2.1.0 includes new features and bug fixes.",
      duration: 6000
    })
  }

  // Confirmation Dialog Handlers
  const handleDeleteAction = async () => {
    const confirmed = await showConfirmation({
      title: "Delete Project",
      description: "This will permanently delete the project and all associated data. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: () => {
        // Simulate delete action
        setTimeout(() => {
          toast.success({
            title: "Project deleted",
            description: "The project has been successfully deleted.",
          })
        }, 600)
      }
    })
  }

  const handleWarningAction = async () => {
    const confirmed = await showConfirmation({
      title: "Unsaved Changes",
      description: "You have unsaved changes. Are you sure you want to leave?",
      confirmText: "Leave",
      cancelText: "Stay",
      variant: "warning",
      onConfirm: () => {
        toast.info({
          title: "Changes discarded",
          description: "Your unsaved changes have been discarded.",
        })
      }
    })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Notification Components Demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interactive showcase of toast notifications, modals, confirmation dialogs, and drawers with smooth animations
            </p>
          </div>

          {/* Toast Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Toast Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button onClick={showSuccessToast} variant="default" className="w-full">
                  Success Toast
                </Button>
                <Button onClick={showErrorToast} variant="destructive" className="w-full">
                  Error Toast
                </Button>
                <Button onClick={showWarningToast} variant="outline" className="w-full">
                  Warning Toast
                </Button>
                <Button onClick={showInfoToast} variant="secondary" className="w-full">
                  Info Toast
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Features:</strong> Slide and fade animations, auto-dismiss, different variants with icons, 
                  hover effects, and smooth exit transitions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Modal Components Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Modal Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={basicModal.open} className="w-full">
                  Basic Modal
                </Button>
                <Button onClick={glassModal.open} variant="outline" className="w-full">
                  Glass Modal
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Features:</strong> Backdrop blur effects, scale animations with bounce easing, 
                  smooth transitions, and glass morphism variant.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Dialogs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirmation Dialogs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleDeleteAction} variant="destructive" className="w-full">
                  Delete Action
                </Button>
                <Button onClick={handleWarningAction} variant="outline" className="w-full">
                  Warning Dialog
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Features:</strong> Shake animations for destructive actions, contextual variants, 
                  icon animations, and promise-based API for easy async handling.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Drawer Components Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Drawer Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={rightDrawer.open} className="w-full">
                  Right Drawer
                </Button>
                <Button onClick={leftDrawer.open} variant="outline" className="w-full">
                  Left Drawer
                </Button>
                <Button onClick={topDrawer.open} variant="secondary" className="w-full">
                  Top Drawer
                </Button>
                <Button onClick={bottomDrawer.open} variant="outline" className="w-full">
                  Bottom Drawer
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Features:</strong> Smooth slide transitions from all directions, drag-to-close functionality, 
                  multiple sizes, drag handles, and responsive positioning.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Animation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Animation Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Toast Animations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Slide in from right with scale effect</li>
                  <li>• Smooth fade transitions</li>
                  <li>• Hover scale animations</li>
                  <li>• Staggered exit animations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Modal Animations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Backdrop blur with fade</li>
                  <li>• Scale with bounce easing</li>
                  <li>• Glass morphism effects</li>
                  <li>• Focus trap with smooth transitions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Confirmation Dialogs</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Shake animations for destructive actions</li>
                  <li>• Icon scale animations</li>
                  <li>• Contextual color variants</li>
                  <li>• Button hover and tap effects</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Drawer Animations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Direction-based slide transitions</li>
                  <li>• Drag gestures with physics</li>
                  <li>• Smooth easing curves</li>
                  <li>• Backdrop blur effects</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toast Viewport */}
        <ToastViewport />
        {toasts.map((toastData) => (
          <Toast key={toastData.id} variant={toastData.variant}>
            <ToastTitle>{toastData.title}</ToastTitle>
            {toastData.description && (
              <ToastDescription>{toastData.description}</ToastDescription>
            )}
            {toastData.action}
            <ToastClose onClick={() => removeToast(toastData.id)} />
          </Toast>
        ))}

        {/* Basic Modal */}
        <Modal open={basicModal.isOpen} onOpenChange={basicModal.close}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Settings</ModalTitle>
              <ModalDescription>
                Configure your application settings and preferences.
              </ModalDescription>
            </ModalHeader>
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notifications</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dark Mode</span>
                <Badge variant="outline">Auto</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Language</span>
                <Badge>English</Badge>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={basicModal.close}>
                Cancel
              </Button>
              <Button onClick={basicModal.close}>
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Glass Modal */}
        <Modal open={glassModal.isOpen} onOpenChange={glassModal.close}>
          <GlassModalContent>
            <ModalHeader>
              <ModalTitle className="text-white">Share Content</ModalTitle>
              <ModalDescription className="text-white/80">
                Choose how you'd like to share this content with others.
              </ModalDescription>
            </ModalHeader>
            <div className="py-4 space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Share2 className="h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={glassModal.close} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Cancel
              </Button>
            </ModalFooter>
          </GlassModalContent>
        </Modal>

        {/* Confirmation Dialog */}
        <ConfirmationDialog />

        {/* Right Drawer */}
        <Drawer open={rightDrawer.isOpen} onOpenChange={rightDrawer.close}>
          <DrawerContent placement="right" size="md" showHandle>
            <DrawerHeader>
              <DrawerTitle>User Profile</DrawerTitle>
              <DrawerDescription>
                Manage your account settings and preferences.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">John Doe</h3>
                    <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                </div>
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button onClick={rightDrawer.close}>Done</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Left Drawer */}
        <Drawer open={leftDrawer.isOpen} onOpenChange={leftDrawer.close}>
          <DrawerContent placement="left" size="sm">
            <DrawerHeader>
              <DrawerTitle>Navigation</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Projects
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Settings
                </Button>
              </nav>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Top Drawer */}
        <Drawer open={topDrawer.isOpen} onOpenChange={topDrawer.close}>
          <DrawerContent placement="top" size="sm" showHandle>
            <DrawerHeader>
              <DrawerTitle>Quick Actions</DrawerTitle>
              <DrawerDescription>
                Frequently used actions and shortcuts.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Bottom Drawer */}
        <Drawer open={bottomDrawer.isOpen} onOpenChange={bottomDrawer.close}>
          <DrawerContent placement="bottom" size="md" showHandle>
            <DrawerHeader>
              <DrawerTitle>Recent Activity</DrawerTitle>
              <DrawerDescription>
                Your latest actions and updates.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Project updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">File uploaded</span>
                  </div>
                  <span className="text-xs text-muted-foreground">5 min ago</span>
                </div>
              </div>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </ToastProvider>
  )
}
