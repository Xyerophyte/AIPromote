# Animated Button Components

A comprehensive set of animated button components built with React, TypeScript, Framer Motion, and Tailwind CSS. These components provide multiple variants with advanced animations, hover effects, and customizable styling options.

## Features

- ✨ **Multiple Variants**: Primary, Secondary, Icon, Loading, Ghost, and Outline buttons
- 🎬 **Advanced Animations**: Hover shine effects, scale animations, ripple effects
- ⚡ **Interactive States**: Loading states with spinners and progress bars
- 🎯 **Icon Support**: Rotating and pulsing icon animations
- 🎨 **Customizable**: Custom glow colors, ripple effects, and sizes
- ♿ **Accessible**: Focus states, ARIA attributes, and keyboard navigation
- 📱 **Responsive**: Works across different screen sizes
- 🚀 **Performance Optimized**: Uses transform-gpu and will-change for smooth animations

## Installation

The components are already set up in your project. Make sure you have the following dependencies installed:

```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

## Usage

### Basic Usage

```tsx
import { AnimatedButton } from '@/components/ui/animated-button'

// Simple primary button
<AnimatedButton variant="primary">
  Get Started
</AnimatedButton>
```

### With Icons

```tsx
import { Play, ArrowRight } from 'lucide-react'

// Button with left icon
<AnimatedButton 
  variant="primary" 
  leftIcon={<Play className="w-4 h-4" />}
>
  Play Video
</AnimatedButton>

// Button with right icon
<AnimatedButton 
  variant="secondary" 
  rightIcon={<ArrowRight className="w-4 h-4" />}
>
  Continue
</AnimatedButton>
```

### Loading States

```tsx
const [loading, setLoading] = useState(false)

<AnimatedButton 
  variant="loading"
  loading={loading}
  loadingText="Processing..."
  onClick={() => setLoading(true)}
>
  Submit Form
</AnimatedButton>
```

### Icon Buttons

```tsx
import { Heart, Settings } from 'lucide-react'

// Icon-only button with rotating animation
<AnimatedButton 
  variant="icon" 
  size="icon"
  leftIcon={<Heart className="w-5 h-5" />}
  title="Like"
/>

// Icon button with settings
<AnimatedButton 
  variant="icon" 
  size="icon"
  leftIcon={<Settings className="w-5 h-5" />}
  title="Settings"
/>
```

### Custom Colors and Effects

```tsx
// Custom glow and ripple colors
<AnimatedButton 
  variant="primary"
  glowColor="rgba(239, 68, 68, 0.4)"
  rippleColor="rgba(248, 113, 113, 0.6)"
>
  Red Glow
</AnimatedButton>

// Custom green theme
<AnimatedButton 
  variant="primary"
  glowColor="rgba(34, 197, 94, 0.4)"
  rippleColor="rgba(74, 222, 128, 0.6)"
>
  Green Glow
</AnimatedButton>
```

## Props

### AnimatedButtonProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "icon" \| "loading" \| "ghost" \| "outline"` | `"primary"` | Button style variant |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` | Button size |
| `loading` | `boolean` | `false` | Show loading state |
| `loadingText` | `string` | `"Loading..."` | Text to display during loading |
| `leftIcon` | `React.ReactNode` | - | Icon to display on the left |
| `rightIcon` | `React.ReactNode` | - | Icon to display on the right |
| `rippleColor` | `string` | `"rgba(255, 255, 255, 0.6)"` | Color of the ripple effect |
| `glowColor` | `string` | `"rgba(59, 130, 246, 0.4)"` | Color of the glow effect |
| `disabled` | `boolean` | `false` | Disable the button |
| `onClick` | `(e: MouseEvent) => void` | - | Click handler |
| `className` | `string` | - | Additional CSS classes |

## Button Variants

### Primary Button
- **Features**: Gradient background, hover shine effect, glow on hover
- **Use Case**: Primary actions, call-to-action buttons
- **Animation**: Shine sweep on hover, scale on press

### Secondary Button
- **Features**: Border animations, scale effects, subtle shadows
- **Use Case**: Secondary actions, alternative options
- **Animation**: Scale up on hover, border color transitions

### Icon Button
- **Features**: Circular design, rotating/pulsing icons
- **Use Case**: Action buttons without text, toolbar buttons
- **Animation**: Icon rotation/pulse, scale on hover

### Loading Button
- **Features**: Integrated spinner, progress bar indicator
- **Use Case**: Form submissions, data processing
- **Animation**: Spinner rotation, progress bar animation

### Ghost Button
- **Features**: Transparent background, subtle hover effects
- **Use Case**: Tertiary actions, subtle interactions
- **Animation**: Background fade-in on hover

### Outline Button
- **Features**: Border-only design, color transitions
- **Use Case**: Alternative primary actions, secondary CTAs
- **Animation**: Background fill on hover, border animations

## Animations

### Hover Effects
- **Scale Animation**: Buttons scale slightly on hover (1.02x for most, 1.1x for icon)
- **Glow Effect**: Primary buttons show a colored glow shadow on hover
- **Shine Effect**: Primary buttons have a moving shine overlay
- **Color Transitions**: Smooth color changes for backgrounds and borders

### Click Effects
- **Ripple Animation**: Expanding circle from click position
- **Press Animation**: Scale down to 0.95x on press for tactile feedback
- **Spring Physics**: Natural bouncy animations using Framer Motion

### Loading States
- **Spinner Animation**: Rotating loading spinner
- **Progress Bar**: Animated progress indicator for loading variant
- **State Transitions**: Smooth transitions between normal and loading states

### Icon Animations
- **Rotation**: Icons in icon variant rotate continuously
- **Pulse**: Alternative pulsing animation for icons
- **Enter/Exit**: Icons slide in from sides with fade

## Accessibility

- **Focus States**: Visible focus rings with proper contrast
- **ARIA Labels**: Support for title and aria-label attributes
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper semantic markup
- **Reduced Motion**: Respects user's motion preferences

## Performance

- **GPU Acceleration**: Uses `transform-gpu` for smooth animations
- **Will-Change**: Optimizes rendering for animated properties
- **Efficient Re-renders**: Minimizes unnecessary component updates
- **Memory Management**: Proper cleanup of animation timers

## Customization

### Tailwind Classes
You can override styles using Tailwind classes:

```tsx
<AnimatedButton 
  variant="primary"
  className="bg-red-500 hover:bg-red-600"
>
  Custom Red Button
</AnimatedButton>
```

### CSS Variables
The components support CSS custom properties for advanced theming:

```css
.my-custom-button {
  --glow-color: rgba(255, 0, 0, 0.4);
}
```

### Extending Variants
You can extend the component to add new variants by modifying the `variantClasses` object in the source code.

## Examples

Visit `/test-animations` to see all button variants in action with interactive examples and code snippets.

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Contributing

When adding new features or variants:

1. Maintain consistent API with existing props
2. Add proper TypeScript types
3. Include accessibility features
4. Test across different browsers
5. Update this documentation

## License

This component library is part of the AIPromote frontend project.
