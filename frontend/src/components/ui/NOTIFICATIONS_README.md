# Notification Components

A comprehensive set of animated notification components built with React, Framer Motion, and Radix UI primitives.

## Components Overview

### 🍞 Toast Notifications (`toast.tsx`)

Slide-in notifications with automatic dismissal and smooth animations.

**Features:**
- Slide and fade animations from the right
- Auto-dismiss with configurable duration
- Multiple variants: success, error, warning, info
- Hover effects and smooth transitions
- Built-in icons and custom icon support
- Stack management with AnimatePresence

**Usage:**
```tsx
import { useToast } from "@/components/ui/toast"

const { toast } = useToast()

// Success toast
toast.success({
  title: "Success!",
  description: "Operation completed successfully.",
  duration: 4000
})

// Error toast
toast.error({
  title: "Error",
  description: "Something went wrong."
})
```

### 🏠 Modal Components (`modal.tsx`)

Centered dialogs with backdrop blur and scale animations.

**Features:**
- Backdrop blur with fade animations
- Scale entrance with bounce easing
- Glass morphism variant
- Multiple sizes (sm, md, lg, xl, full)
- Focus trap and accessibility
- Smooth transitions

**Usage:**
```tsx
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"

<Modal open={isOpen} onOpenChange={setIsOpen}>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Settings</ModalTitle>
    </ModalHeader>
    {/* Content */}
  </ModalContent>
</Modal>
```

### ⚠️ Confirmation Dialogs (`confirmation-dialog.tsx`)

Specialized dialogs for confirmations with shake animations for destructive actions.

**Features:**
- Shake animations for destructive actions
- Contextual variants (default, destructive, warning)
- Icon animations with spring effects
- Promise-based API for async handling
- Specialized delete confirmation dialog
- Enhanced visual feedback

**Usage:**
```tsx
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"

const { showConfirmation } = useConfirmationDialog()

const handleDelete = async () => {
  const confirmed = await showConfirmation({
    title: "Delete Item",
    description: "This action cannot be undone.",
    variant: "destructive",
    onConfirm: () => {
      // Handle deletion
    }
  })
}
```

### 📱 Drawer Components (`drawer.tsx`)

Slide-out panels from any direction with drag-to-close functionality.

**Features:**
- Smooth slide transitions from all directions (top, bottom, left, right)
- Drag-to-close with physics-based interactions
- Multiple sizes and responsive design
- Drag handles for better UX
- Custom easing curves
- Backdrop blur effects

**Usage:**
```tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

<Drawer open={isOpen} onOpenChange={setIsOpen}>
  <DrawerContent placement="right" size="md" showHandle>
    <DrawerHeader>
      <DrawerTitle>Settings</DrawerTitle>
    </DrawerHeader>
    {/* Content */}
  </DrawerContent>
</Drawer>
```

## Animation Details

### Toast Animations
- **Entrance**: Slide from right with scale (0.8 → 1.0)
- **Exit**: Slide to right with scale and fade
- **Hover**: Subtle scale increase (1.02)
- **Stacking**: Automatic layout animations

### Modal Animations
- **Backdrop**: Fade in/out with blur effect
- **Content**: Scale with bounce easing (cubic-bezier(0.34, 1.56, 0.64, 1))
- **Entrance**: Scale from 0.8 with upward motion
- **Exit**: Scale to 0.8 with downward motion

### Confirmation Dialog Animations
- **Normal**: Standard modal animations
- **Destructive**: Enhanced shake animation with scale variations
- **Icon**: Spring entrance animation with delay
- **Button**: Hover and tap effects

### Drawer Animations
- **Slide**: Direction-based entrance from edges
- **Drag**: Physics-based interactions with elastic constraints
- **Easing**: Custom smooth curve (cubic-bezier(0.32, 0.72, 0, 1))
- **Backdrop**: Synchronized blur animations

## Performance Optimizations

- **transform-gpu**: Hardware acceleration for smoother animations
- **will-change-transform**: Optimization hint for animated elements
- **layout**: Framer Motion's layout animations for smooth repositioning
- **AnimatePresence**: Proper exit animations with mode="popLayout"

## Accessibility

- **Focus Management**: Automatic focus trapping in modals/drawers
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and descriptions
- **Motion Preferences**: Respects user's reduced motion preferences

## Customization

All components support:
- Custom className props
- Tailwind CSS styling
- CSS custom properties
- Variant customization
- Animation timing adjustments

## Demo

Visit `/notifications-demo` to see all components in action with interactive examples.
