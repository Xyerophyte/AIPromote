# Animation Performance & Accessibility Guide

This document outlines the performance and accessibility optimizations implemented in the animation system.

## 🚀 Performance Optimizations

### 1. CSS Transform Optimization
- All animations use CSS `transform` properties instead of changing `left`, `top`, or other layout-affecting properties
- Added `will-change` CSS property to elements that will be animated
- GPU acceleration is enabled through `transform-gpu` utility classes

### 2. Lazy Loading
- Heavy animations (like particles) only load when visible in viewport
- Uses `IntersectionObserver` API for efficient viewport detection  
- Reduces initial page load time and memory usage

### 3. Device Performance Detection
- Automatic detection of low-performance devices based on:
  - CPU cores (`navigator.hardwareConcurrency`)
  - Available memory (`navigator.deviceMemory`) 
  - Network speed (`navigator.connection`)
  - Device type (mobile vs desktop)

### 4. Adaptive Settings
- Reduced particle counts on low-performance devices
- Shorter animation durations for better performance
- Disabled resource-intensive effects (blur, shadows) on slow devices

### 5. Performance Monitoring
- Real-time FPS tracking during animations
- Frame drop detection and reporting
- Automatic performance issue detection and fallbacks

## ♿ Accessibility Optimizations  

### 1. Reduced Motion Support
- Full support for `prefers-reduced-motion: reduce` CSS media query
- Animations are disabled or simplified based on user preference
- Fallback to instant state changes instead of animated transitions

### 2. Animation Control
- Users with motion sensitivity get static content without animations
- Hover effects and micro-interactions respect motion preferences
- Parallax effects are disabled for reduced motion users

### 3. Performance-Based Accessibility
- Poor performance automatically triggers reduced motion mode
- Ensures smooth experience even on slower devices
- Graceful degradation without functionality loss

## 🔧 Implementation Details

### Core Hooks

#### `useReducedMotion()`
```typescript
const prefersReducedMotion = useReducedMotion()
// Returns true if user prefers reduced motion
```

#### `useAnimationSettings()`
```typescript
const { prefersReducedMotion, duration, spring, transition } = useAnimationSettings()
// Returns optimized animation settings based on user preferences
```

#### `useLazyAnimation()`
```typescript  
const { ref, shouldAnimate, isVisible } = useLazyAnimation({
  threshold: 0.1,
  triggerOnce: true
})
// Delays animation loading until element is visible
```

### Performance Monitoring

#### `useAnimationPerformanceMonitor()`
```typescript
const {
  startMonitoring,
  stopMonitoring, 
  getCurrentMetrics,
  isLowPerformanceDevice,
  recommendedSettings
} = useAnimationPerformanceMonitor()
```

### CSS Optimizations

#### Media Query Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Performance-Optimized Classes
```css
.animate-fade-in {
  animation: fade-in 0.6s ease-in-out;
  will-change: opacity;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;  
  will-change: transform, opacity;
}
```

## 📱 Mobile Optimization

### Touch-Friendly Interactions
- Simplified animations on mobile devices
- Reduced particle counts for better performance
- Touch-optimized button interactions without complex hover effects

### Network Awareness
- Slower animations on slow network connections
- Reduced visual effects for 2G/3G users
- Efficient asset loading strategies

## 🧪 Testing Performance

### Test Page
Visit `/test-performance` to:
- Monitor real-time FPS during animations
- Test reduced motion preferences
- Verify lazy loading functionality
- Check device performance detection

### Performance Metrics
- **FPS**: Target 60fps, acceptable >45fps
- **Frame Drops**: Monitor frames taking >16.67ms
- **Memory Usage**: Track animation memory footprint
- **Load Time**: Measure impact on initial page load

## 🛠️ Best Practices

### Component Implementation
1. Always check `prefersReducedMotion` before animations
2. Use `will-change` for animating elements  
3. Clean up animations in useEffect cleanup
4. Lazy load heavy animations
5. Provide static fallbacks

### Animation Guidelines
1. Use CSS transforms over position changes
2. Avoid animating layout-affecting properties
3. Keep animation durations reasonable (0.2s-0.6s)
4. Minimize simultaneous animations
5. Use `GPU acceleration` when beneficial

### Accessibility Checklist
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Alternative content available for disabled animations  
- [ ] Interactive elements work without animations
- [ ] Performance doesn't degrade accessibility
- [ ] Focus management during animations

## 🔍 Debugging

### Performance Issues
1. Use browser DevTools Performance tab
2. Monitor the test performance page metrics
3. Check for layout thrashing
4. Verify GPU layer creation
5. Analyze animation frame timing

### Common Issues
- **High memory usage**: Reduce particle counts or disable blur effects
- **Low FPS**: Implement device detection and reduce animation complexity
- **Layout shifts**: Use `will-change` and avoid animating layout properties
- **Flash of animated content**: Implement proper loading states

## 📚 Resources

- [Web Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_animation_performance)
- [Reduced Motion Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Will-Change Property](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## 🤝 Contributing

When adding new animations:
1. Include reduced motion support
2. Add performance optimizations  
3. Update tests with new components
4. Document any breaking changes
5. Consider mobile performance impact
