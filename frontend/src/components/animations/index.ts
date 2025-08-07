// Animation Components Library
// Reusable animation wrappers built with Framer Motion

export { FadeIn } from "./fade-in"
export type { FadeInProps } from "./fade-in"

export { SlideIn } from "./slide-in"
export type { SlideInProps } from "./slide-in"

export { StaggerChildren } from "./stagger-children"
export type { StaggerChildrenProps } from "./stagger-children"

export { 
  AnimatedCard, 
  AnimatedCardHeader, 
  AnimatedCardFooter, 
  AnimatedCardTitle, 
  AnimatedCardDescription, 
  AnimatedCardContent 
} from "./animated-card"
export type { AnimatedCardProps } from "./animated-card"

export { GlassContainer } from "./glass-container"
export type { GlassContainerProps } from "./glass-container"

export { Typewriter } from "./typewriter"
export type { TypewriterProps } from "./typewriter"

export { AnimatedGradient } from "./animated-gradient"
export type { AnimatedGradientProps } from "./animated-gradient"

export { FloatingParticles } from "./floating-particles"
export type { FloatingParticlesProps } from "./floating-particles"

export { ParallaxContainer } from "./parallax-container"
export type { ParallaxContainerProps } from "./parallax-container"

// Advanced Effects
export { 
  MagneticButton,
  TextScramble, 
  MorphingIcon,
  LiquidLoading,
  FloatingActionButton
} from "./advanced-effects"

// 3D Card Stack
export { CardStack3D, DEMO_CARDS } from "./card-stack-3d"

// Page Transition Components
export { PageTransition } from "./page-transition"
export type { PageTransitionProps } from "./page-transition"

export { AdvancedPageTransition, staggerChildrenVariants, childVariants } from "./advanced-page-transition"
export type { AdvancedPageTransitionProps } from "./advanced-page-transition"

export { SharedElement, useSharedElementId } from "./shared-element"
export type { SharedElementProps } from "./shared-element"

export { RouteProgress, useRouteProgress } from "./route-progress"
export type { RouteProgressProps } from "./route-progress"

export { 
  PageAnimationProvider, 
  usePageAnimation, 
  useTemporaryTransition 
} from "./page-animation-provider"
export type { 
  PageAnimationProviderProps, 
  PageAnimationContextType 
} from "./page-animation-provider"

// Notification Components
export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastContainer,
  useToast
} from "../ui/toast"
export type { ToastProps, ToastActionElement } from "../ui/toast"

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
  useModal
} from "../ui/modal"

export {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  useConfirmationDialog
} from "../ui/confirmation-dialog"
export type { ConfirmationDialogProps, DeleteConfirmationDialogProps } from "../ui/confirmation-dialog"

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
  useDrawer
} from "../ui/drawer"
export type { DrawerPlacement, DrawerSize, DrawerContentProps } from "../ui/drawer"
