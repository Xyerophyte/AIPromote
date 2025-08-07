# Advanced Card Components

A comprehensive collection of beautiful card components with advanced animations and effects built with Framer Motion and Tailwind CSS.

## Components Overview

### 🚀 ElevatedCard
Cards with subtle shadow elevation that increase on hover.

**Features:**
- Configurable elevation levels (1-5)
- Smooth shadow transitions
- Optional glow effects
- Customizable glow colors

**Usage:**
```tsx
import { ElevatedCard } from "@/components/ui/advanced-card"

<ElevatedCard 
  elevation={2} 
  hoverElevation={4}
  glowEffect={true}
  glowColor="rgba(147, 51, 234, 0.2)"
  className="p-6"
>
  <h3>Card Title</h3>
  <p>Card content...</p>
</ElevatedCard>
```

### 🎯 TiltCard
Cards that tilt based on mouse position with realistic 3D effects.

**Features:**
- Mouse-tracking tilt animation
- Configurable tilt angles
- Optional glare effects
- Smooth spring animations

**Usage:**
```tsx
import { TiltCard } from "@/components/ui/advanced-card"

<TiltCard 
  tiltMaxX={25} 
  tiltMaxY={25} 
  scale={1.05}
  glareEnable={true}
  className="p-6"
>
  <h3>Tilt me!</h3>
  <p>Move your mouse around to see the tilt effect</p>
</TiltCard>
```

### 📋 ExpandableCard
Cards with smooth expandable content sections.

**Features:**
- Smooth height transitions
- Custom expand icons
- Header content slots
- Click to expand/collapse

**Usage:**
```tsx
import { ExpandableCard } from "@/components/ui/advanced-card"

<ExpandableCard 
  title="FAQ Question"
  headerContent={<Badge>New</Badge>}
  defaultExpanded={false}
>
  <p>This content is revealed when expanded...</p>
</ExpandableCard>
```

### ⏳ CardSkeleton
Loading state placeholders with pulse animations.

**Features:**
- Configurable avatar display
- Variable content lines
- Optional action buttons
- Smooth pulse animation

**Usage:**
```tsx
import { CardSkeleton } from "@/components/ui/advanced-card"

<CardSkeleton 
  showAvatar={true}
  showActions={true}
  lines={3}
  className="h-64"
/>
```

### 🔄 FlipCard
Cards with 3D flip animations revealing different content.

**Features:**
- Hover or click triggers
- Horizontal or vertical flip
- Smooth 3D transitions
- Separate front/back content

**Usage:**
```tsx
import { FlipCard } from "@/components/ui/advanced-card"

<FlipCard
  triggerMode="hover"
  flipDirection="horizontal"
  frontContent={
    <div className="p-6">
      <h3>Front Side</h3>
    </div>
  }
  backContent={
    <div className="p-6">
      <h3>Back Side</h3>
      <p>Hidden content revealed on flip!</p>
    </div>
  }
/>
```

### 🌟 GlassCard
Cards with glassmorphism effects for modern interfaces.

**Features:**
- Configurable blur intensity
- Variable opacity levels
- Backdrop filter effects
- Subtle hover animations

**Usage:**
```tsx
import { GlassCard } from "@/components/ui/advanced-card"

<GlassCard 
  blurIntensity="medium" 
  opacity="medium"
  className="p-6"
>
  <h3>Glass Effect</h3>
  <p>Beautiful glassmorphism design</p>
</GlassCard>
```

## Real-World Examples

### Product Card
```tsx
import { TiltCard } from "@/components/ui/advanced-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

<TiltCard className="p-0 overflow-hidden max-w-sm">
  <img src={product.image} className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
    <p className="text-gray-600 mb-4">{product.description}</p>
    <div className="flex items-center justify-between">
      <span className="text-2xl font-bold">${product.price}</span>
      <Button size="sm">Add to Cart</Button>
    </div>
  </div>
</TiltCard>
```

### Team Member Card
```tsx
<FlipCard
  triggerMode="hover"
  frontContent={
    <div className="p-6 text-center">
      <img src={member.avatar} className="w-24 h-24 rounded-full mx-auto mb-4" />
      <h3 className="text-xl font-semibold">{member.name}</h3>
      <p className="text-gray-600">{member.role}</p>
    </div>
  }
  backContent={
    <div className="p-6">
      <h4 className="font-semibold mb-4">Skills</h4>
      <div className="flex flex-wrap gap-2">
        {member.skills.map(skill => (
          <Badge key={skill} variant="secondary">{skill}</Badge>
        ))}
      </div>
    </div>
  }
/>
```

### Dashboard Stats
```tsx
<GlassCard className="p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-medium">Total Users</h3>
    <UsersIcon className="w-5 h-5" />
  </div>
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold">12,543</span>
    <Badge variant="default">+12%</Badge>
  </div>
</GlassCard>
```

## Styling & Customization

### CSS Classes
The components use custom CSS classes defined in `card-effects.css`:

- `.preserve-3d` - 3D transform preservation
- `.backface-hidden` - Hide element back faces
- `.perspective-1000` - Set 3D perspective
- `.glass-effect` - Glassmorphism styling
- `.card-hover-lift` - Hover elevation effect

### Tailwind Configuration
Custom utilities in `tailwind.config.js`:

```js
// Glow effects
boxShadow: {
  'glow': '0 0 20px var(--glow-color, rgba(59, 130, 246, 0.15))',
  'glow-lg': '0 0 30px var(--glow-color, rgba(59, 130, 246, 0.15))',
}

// Glass colors
colors: {
  glass: {
    'white-light': 'rgba(255, 255, 255, 0.05)',
    'white-medium': 'rgba(255, 255, 255, 0.15)',
    'white-strong': 'rgba(255, 255, 255, 0.25)',
  }
}
```

## Animation Performance

### Optimizations
- Uses Framer Motion's optimized animations
- Hardware acceleration with `transform3d`
- Efficient re-renders with `useMotionValue`
- Spring physics for smooth interactions

### Best Practices
1. **Avoid overuse** - Don't apply heavy animations to every card
2. **Progressive enhancement** - Provide fallbacks for reduced motion
3. **Performance monitoring** - Test on lower-end devices
4. **Accessibility** - Respect `prefers-reduced-motion`

## Props Reference

### ElevatedCard Props
```typescript
interface ElevatedCardProps {
  children: React.ReactNode
  elevation?: 1 | 2 | 3 | 4 | 5
  hoverElevation?: 1 | 2 | 3 | 4 | 5
  animateOnHover?: boolean
  glowEffect?: boolean
  glowColor?: string
}
```

### TiltCard Props
```typescript
interface TiltCardProps {
  children: React.ReactNode
  tiltMaxX?: number // Max X-axis tilt (degrees)
  tiltMaxY?: number // Max Y-axis tilt (degrees)
  scale?: number    // Hover scale multiplier
  glareEnable?: boolean
  perspective?: number
}
```

### FlipCard Props
```typescript
interface FlipCardProps {
  frontContent: React.ReactNode
  backContent: React.ReactNode
  triggerMode?: "hover" | "click"
  flipDirection?: "horizontal" | "vertical"
}
```

### CardSkeleton Props
```typescript
interface CardSkeletonProps {
  showAvatar?: boolean
  showActions?: boolean
  lines?: number // Number of content lines
}
```

## Dependencies

- `framer-motion` - Animation library
- `react` - Core framework
- `tailwindcss` - Styling utilities
- Custom CSS for 3D effects

## Browser Support

- ✅ Chrome/Edge 80+
- ✅ Firefox 72+
- ✅ Safari 13.1+
- ⚠️  IE not supported (uses modern CSS features)

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- Respects motion preferences
- Focus indicators included
- ARIA labels where appropriate

## Demo

Visit `/card-showcase` to see all components in action with interactive examples.
