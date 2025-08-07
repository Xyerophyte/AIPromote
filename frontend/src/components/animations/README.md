# Animation Components Library

A collection of reusable animation components built with **Framer Motion** and **Tailwind CSS**. These components provide smooth, performant animations with extensive customization options.

## Components Overview

### 1. FadeIn
Smooth fade-in animations with directional movement support.

**Features:**
- Customizable delay and duration
- Multiple directions (up, down, left, right)
- Intersection observer support
- TypeScript support

**Usage:**
```tsx
import { FadeIn } from "@/components/animations"

<FadeIn delay={0.2} duration={0.8} direction="up" distance={50}>
  <div>Your content here</div>
</FadeIn>
```

**Props:**
- `delay?: number` - Animation delay in seconds (default: 0)
- `duration?: number` - Animation duration in seconds (default: 0.6)
- `direction?: "up" | "down" | "left" | "right"` - Animation direction (default: "up")
- `distance?: number` - Distance to move in pixels (default: 30)
- `once?: boolean` - Animate only once (default: true)
- `threshold?: number` - Intersection threshold (default: 0.1)

### 2. SlideIn
Slide animations from different directions with custom easing.

**Features:**
- Multiple slide directions
- Custom easing options
- Configurable distance and timing
- Viewport-based triggering

**Usage:**
```tsx
import { SlideIn } from "@/components/animations"

<SlideIn direction="left" distance={150} easing="backOut" duration={1.2}>
  <div>Sliding content</div>
</SlideIn>
```

**Props:**
- `direction: "left" | "right" | "up" | "down"` - Required slide direction
- `distance?: number` - Slide distance in pixels (default: 100)
- `delay?: number` - Animation delay (default: 0)
- `duration?: number` - Animation duration (default: 0.8)
- `easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "backOut" | "bounce"` - Easing function (default: "easeOut")

### 3. StaggerChildren
Stagger animations for list items and multiple elements.

**Features:**
- Automatic child element wrapping
- Multiple animation directions
- Configurable stagger timing
- Reverse animation support

**Usage:**
```tsx
import { StaggerChildren } from "@/components/animations"

<StaggerChildren staggerDelay={0.15} direction="scale" initialDelay={0.3}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerChildren>
```

**Props:**
- `staggerDelay?: number` - Delay between child animations (default: 0.1)
- `initialDelay?: number` - Initial delay before first child (default: 0)
- `direction?: "up" | "down" | "left" | "right" | "scale" | "fade"` - Animation type (default: "up")
- `distance?: number` - Movement distance for directional animations (default: 20)
- `reverse?: boolean` - Reverse the stagger order (default: false)

### 4. AnimatedCard
Enhanced card component with hover effects and customizable animations.

**Features:**
- Hover scale and rotation effects
- Multiple shadow intensities
- Optional glow effects
- Spring-based animations
- All standard card sub-components

**Usage:**
```tsx
import { 
  AnimatedCard, 
  AnimatedCardHeader, 
  AnimatedCardTitle, 
  AnimatedCardContent 
} from "@/components/animations"

<AnimatedCard 
  hoverScale={1.05} 
  shadowIntensity="xl" 
  glowEffect={true}
  borderRadius="2xl"
>
  <AnimatedCardHeader>
    <AnimatedCardTitle>Card Title</AnimatedCardTitle>
  </AnimatedCardHeader>
  <AnimatedCardContent>
    Card content goes here
  </AnimatedCardContent>
</AnimatedCard>
```

**Props:**
- `hoverScale?: number` - Scale factor on hover (default: 1.02)
- `hoverRotation?: number` - Rotation degrees on hover (default: 0)
- `shadowIntensity?: "sm" | "md" | "lg" | "xl" | "2xl"` - Shadow size (default: "md")
- `borderRadius?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"` - Border radius (default: "lg")
- `glowEffect?: boolean` - Enable glow effect (default: false)
- `glowColor?: string` - Glow color (default: "rgba(59, 130, 246, 0.15)")
- `animateOnHover?: boolean` - Enable hover animations (default: true)
- `animateOnView?: boolean` - Enable entrance animation (default: true)

### 5. GlassContainer
Glassmorphism container with backdrop blur effects.

**Features:**
- Customizable blur intensity
- Gradient backgrounds
- Border and shadow options
- Hover glow effects
- Responsive design

**Usage:**
```tsx
import { GlassContainer } from "@/components/animations"

<GlassContainer 
  blurIntensity="xl" 
  gradient={true}
  borderIntensity="medium"
  glowOnHover={true}
  className="p-6"
>
  <h3 className="text-white font-semibold">Glassmorphism Content</h3>
  <p className="text-white/80">Beautiful frosted glass effect</p>
</GlassContainer>
```

**Props:**
- `blurIntensity?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"` - Backdrop blur amount (default: "md")
- `opacity?: number` - Background opacity (default: 0.1)
- `borderIntensity?: "none" | "subtle" | "medium" | "strong"` - Border visibility (default: "subtle")
- `gradient?: boolean` - Use gradient background (default: true)
- `gradientFrom?: string` - Gradient start color (default: "rgba(255, 255, 255, 0.1)")
- `gradientTo?: string` - Gradient end color (default: "rgba(255, 255, 255, 0.05)")
- `glowOnHover?: boolean` - Enable hover glow (default: false)

## Installation Requirements

These components require the following dependencies (already installed in this project):

```json
{
  "framer-motion": "^12.x",
  "tailwindcss": "^3.x",
  "tailwindcss-animate": "^1.x"
}
```

## Usage Examples

### Complex Animation Combinations

```tsx
// Staggered cards with glass effect
<StaggerChildren staggerDelay={0.2} direction="up">
  <GlassContainer blurIntensity="lg" className="p-4">
    <FadeIn delay={0.3}>
      <h3>Glass Card 1</h3>
    </FadeIn>
  </GlassContainer>
  
  <AnimatedCard hoverScale={1.03} glowEffect={true}>
    <AnimatedCardContent>
      <SlideIn direction="left" delay={0.4}>
        <p>Animated card content</p>
      </SlideIn>
    </AnimatedCardContent>
  </AnimatedCard>
</StaggerChildren>
```

### Performance Considerations

- All animations use `transform` properties for GPU acceleration
- Intersection Observer API is used for viewport-based animations
- Components support `once={true}` to prevent re-animations on scroll
- Framer Motion automatically handles animation cleanup

### Accessibility

- Respects user's `prefers-reduced-motion` settings
- All animations have reasonable defaults for duration and easing
- Components maintain semantic HTML structure
- Focus states are preserved through animations

## Customization

All components accept standard HTML props and can be styled with Tailwind classes. Use the `className` prop to add additional styling:

```tsx
<FadeIn className="custom-spacing my-8 p-4">
  <div>Custom styled content</div>
</FadeIn>
```

## TypeScript Support

All components are fully typed with TypeScript interfaces exported for use in your applications:

```tsx
import type { FadeInProps, AnimatedCardProps } from "@/components/animations"
```
