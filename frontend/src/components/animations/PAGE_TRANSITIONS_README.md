# Page Transition Animations

A comprehensive page transition system built with Framer Motion for smooth navigation experiences.

## Features

✨ **Multiple Transition Types**
- Basic transitions: fade, slide, scale, mixed
- Advanced transitions: curtain, iris, wave, flip, zoom, slide-stack

🔄 **Shared Element Transitions**
- Maintain visual continuity between routes
- Smooth morphing animations for related elements

📊 **Route Progress Bar**
- Visual feedback during page transitions
- Customizable colors and positioning

⚙️ **Configurable Settings**
- Transition types, directions, and durations
- Accessibility support (prefers-reduced-motion)
- Global state management

## Quick Start

### 1. Wrap your app with PageAnimationProvider

```tsx
// app/layout.tsx
import { PageAnimationProvider } from "@/components/animations"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageAnimationProvider
          defaultTransitionType="basic"
          defaultEffect="mixed"
          defaultDuration={0.3}
          enableProgressBar={true}
        >
          {children}
        </PageAnimationProvider>
      </body>
    </html>
  )
}
```

### 2. Use individual transitions (optional)

```tsx
// For specific pages that need custom transitions
import { PageTransition } from "@/components/animations"

export default function MyPage() {
  return (
    <PageTransition type="slide" direction="right" duration={0.5}>
      <div>Your page content</div>
    </PageTransition>
  )
}
```

## Components

### PageTransition

Basic page transitions with simple effects.

```tsx
<PageTransition 
  type="fade" | "slide" | "scale" | "mixed"
  direction="left" | "right" | "up" | "down"
  duration={0.3}
  delay={0}
>
  {children}
</PageTransition>
```

### AdvancedPageTransition

Complex transitions with sophisticated effects.

```tsx
<AdvancedPageTransition 
  effect="curtain" | "iris" | "wave" | "flip" | "zoom" | "slide-stack"
  direction="left" | "right" | "up" | "down"
  duration={0.8}
  stagger={0.1}
>
  {children}
</AdvancedPageTransition>
```

### SharedElement

For maintaining continuity between related elements across pages.

```tsx
<SharedElement 
  layoutId="unique-id"
  type="morph" | "crossfade" | "scale"
  duration={0.6}
>
  <div>Shared content</div>
</SharedElement>
```

### RouteProgress

Progress bar for route transitions.

```tsx
<RouteProgress 
  color="bg-blue-500"
  height={3}
  duration={0.8}
  position="top" | "bottom"
  showOnRouteChange={true}
/>
```

## Hooks

### usePageAnimation

Access and control page animation settings.

```tsx
const {
  transitionType,
  effect,
  direction,
  duration,
  enableProgressBar,
  setTransitionType,
  setEffect,
  setDirection,
  setDuration,
  setEnableProgressBar
} = usePageAnimation()
```

### useTemporaryTransition

Temporarily change transition settings.

```tsx
const { setTemporaryTransition } = useTemporaryTransition()

// Change settings temporarily
const cleanup = setTemporaryTransition({
  transitionType: "advanced",
  effect: "curtain",
  direction: "right",
  duration: 1.2
}, 3000) // Restore after 3 seconds
```

### useSharedElementId

Generate consistent IDs for shared elements.

```tsx
const elementId = useSharedElementId("card", user.id)
// Returns: "card-123"
```

### useRouteProgress

Manual control over route progress indicator.

```tsx
const { isLoading, start, finish } = useRouteProgress()

// Start progress manually
start()

// Finish when done
finish()
```

## Transition Effects

### Basic Transitions

| Effect | Description |
|--------|-------------|
| `fade` | Simple opacity animation |
| `slide` | Directional sliding motion |
| `scale` | Scale in/out with opacity |
| `mixed` | Combination of fade, scale, and movement |

### Advanced Transitions

| Effect | Description |
|--------|-------------|
| `curtain` | Horizontal reveal like opening curtains |
| `iris` | Circular reveal from center |
| `wave` | Fluid wave-like animation |
| `flip` | 3D flip transition |
| `zoom` | Scale with blur effect |
| `slide-stack` | Layered sliding with scale |

## Configuration

### Global Settings

```tsx
<PageAnimationProvider
  defaultTransitionType="basic"        // "basic" | "advanced"
  defaultEffect="mixed"                // Effect name
  defaultDirection="right"             // "left" | "right" | "up" | "down"
  defaultDuration={0.3}                // Duration in seconds
  enableProgressBar={true}             // Show progress bar
  reducedMotion={false}                // Force reduced motion
/>
```

### Per-Page Overrides

```tsx
// Temporarily change settings for specific interactions
setTemporaryTransition({
  transitionType: "advanced",
  effect: "iris",
  direction: "up",
  duration: 1.0
}, 2000)
```

## Accessibility

The system automatically respects user preferences:

- **Reduced Motion**: Automatically detects `prefers-reduced-motion: reduce`
- **Duration Override**: Reduces animation duration to 0.1s for accessibility
- **Progress Bar**: Disabled when reduced motion is preferred

## Performance Tips

1. **Use Basic Transitions** for frequent navigation
2. **Advanced Transitions** for special pages or effects
3. **Shared Elements** work best with consistent element sizes
4. **Reduce Duration** for better perceived performance
5. **Disable Progress Bar** if not needed

## Examples

### E-commerce Product Detail

```tsx
// Product card with shared element
<SharedElement layoutId={`product-${product.id}`}>
  <ProductCard product={product} />
</SharedElement>

// Product detail page
<SharedElement layoutId={`product-${product.id}`}>
  <ProductDetail product={product} />
</SharedElement>
```

### Dashboard Navigation

```tsx
// Set smooth transitions for dashboard
useEffect(() => {
  setTemporaryTransition({
    transitionType: "basic",
    effect: "slide",
    direction: "right",
    duration: 0.2
  })
}, [])
```

### Special Landing Pages

```tsx
// Dramatic entrance for marketing pages
<AdvancedPageTransition 
  effect="iris" 
  duration={1.2}
  stagger={0.15}
>
  <LandingPageContent />
</AdvancedPageTransition>
```

## Best Practices

1. **Consistent Direction**: Use consistent slide directions for logical navigation
2. **Duration Matching**: Match transition duration with content loading time
3. **Reduced Motion**: Always test with reduced motion preferences
4. **Shared Elements**: Use meaningful layout IDs that won't conflict
5. **Progress Feedback**: Show progress for transitions longer than 0.5s

## Troubleshooting

### Common Issues

**Animations not working:**
- Ensure PageAnimationProvider wraps your app
- Check that Framer Motion is properly installed
- Verify component is client-side (`"use client"`)

**Jerky transitions:**
- Reduce transition duration
- Simplify complex layouts during transitions
- Use `transform` properties instead of layout changes

**Shared elements not morphing:**
- Ensure layoutId is unique and consistent
- Check that elements exist on both pages
- Verify element structure is similar

**Progress bar not showing:**
- Check enableProgressBar setting
- Verify route changes are being detected
- Ensure duration is long enough to see

For more examples, visit `/test-animations` in your application.
