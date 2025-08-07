# Animation Components - Usage Examples

This document provides practical examples of how to use the animation components in real-world scenarios within your Next.js application.

## Quick Start

```tsx
import { 
  FadeIn, 
  SlideIn, 
  StaggerChildren, 
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardContent,
  GlassContainer 
} from "@/components/animations"
```

## Real-World Examples

### 1. Landing Page Hero Section

```tsx
function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="text-center">
        <FadeIn direction="down" delay={0.2}>
          <h1 className="text-6xl font-bold text-white mb-6">
            Welcome to the Future
          </h1>
        </FadeIn>
        
        <FadeIn direction="up" delay={0.5}>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience next-generation technology with beautiful animations
          </p>
        </FadeIn>
        
        <SlideIn direction="up" delay={0.8} easing="backOut">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold">
            Get Started
          </button>
        </SlideIn>
      </div>
    </section>
  )
}
```

### 2. Feature Cards Grid

```tsx
function FeaturesSection() {
  const features = [
    { 
      icon: "⚡", 
      title: "Lightning Fast", 
      description: "Optimized performance for the best user experience" 
    },
    { 
      icon: "🔒", 
      title: "Secure by Default", 
      description: "Enterprise-grade security built into every component" 
    },
    { 
      icon: "🎨", 
      title: "Beautiful Design", 
      description: "Carefully crafted animations and interactions" 
    }
  ]

  return (
    <section className="py-20 px-4">
      <FadeIn className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
        <p className="text-gray-600 text-lg">Discover what makes us different</p>
      </FadeIn>

      <StaggerChildren 
        staggerDelay={0.2} 
        direction="up" 
        className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
      >
        {features.map((feature, index) => (
          <AnimatedCard 
            key={index}
            hoverScale={1.05}
            shadowIntensity="lg"
            glowEffect={true}
            className="p-8 text-center"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </AnimatedCard>
        ))}
      </StaggerChildren>
    </section>
  )
}
```

### 3. Dashboard Layout with Glass Panels

```tsx
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
        
        {/* Sidebar */}
        <SlideIn direction="left" className="col-span-3">
          <GlassContainer 
            blurIntensity="xl"
            borderIntensity="subtle"
            className="p-6 h-full"
          >
            <nav className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-6">Navigation</h2>
              {['Dashboard', 'Analytics', 'Settings'].map((item, index) => (
                <FadeIn key={item} delay={index * 0.1}>
                  <a href="#" className="block text-white/80 hover:text-white py-2">
                    {item}
                  </a>
                </FadeIn>
              ))}
            </nav>
          </GlassContainer>
        </SlideIn>

        {/* Main Content */}
        <div className="col-span-9">
          <FadeIn delay={0.3}>
            <GlassContainer className="p-8 mb-6">
              <h1 className="text-white text-2xl font-bold mb-4">Dashboard Overview</h1>
              {children}
            </GlassContainer>
          </FadeIn>

          {/* Stats Cards */}
          <StaggerChildren 
            staggerDelay={0.15} 
            direction="scale"
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { label: "Users", value: "12,453", change: "+12%" },
              { label: "Revenue", value: "$89,432", change: "+8%" },
              { label: "Orders", value: "1,234", change: "+23%" }
            ].map((stat, index) => (
              <AnimatedCard 
                key={stat.label}
                hoverScale={1.02}
                shadowIntensity="md"
                className="bg-white/10 backdrop-blur-sm p-6"
              >
                <div className="text-white/60 text-sm">{stat.label}</div>
                <div className="text-white text-2xl font-bold">{stat.value}</div>
                <div className="text-green-400 text-sm">{stat.change}</div>
              </AnimatedCard>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </div>
  )
}
```

### 4. Modal Dialog with Animation

```tsx
function AnimatedModal({ isOpen, onClose, children }: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <FadeIn duration={0.3}>
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
      </FadeIn>

      {/* Modal */}
      <SlideIn direction="up" duration={0.4} easing="backOut">
        <GlassContainer 
          blurIntensity="xl"
          borderIntensity="medium"
          className="relative z-10 max-w-md w-full p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            ×
          </button>
          {children}
        </GlassContainer>
      </SlideIn>
    </div>
  )
}

// Usage
function App() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setModalOpen(true)}>Open Modal</button>
      
      <AnimatedModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-white text-xl font-bold mb-4">Animated Modal</h2>
        <p className="text-white/80">This modal slides up with a glass effect!</p>
      </AnimatedModal>
    </div>
  )
}
```

### 5. Product Showcase Page

```tsx
function ProductShowcase() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Product */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <SlideIn direction="left">
            <div>
              <h1 className="text-5xl font-bold mb-6">Revolutionary Product</h1>
              <p className="text-xl text-gray-600 mb-8">
                Experience the future of technology with our latest innovation
              </p>
              <AnimatedCard 
                hoverScale={1.05}
                className="inline-block"
              >
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg">
                  Learn More
                </button>
              </AnimatedCard>
            </div>
          </SlideIn>

          <SlideIn direction="right" delay={0.2}>
            <div className="relative">
              <img 
                src="/product-image.jpg" 
                alt="Product" 
                className="w-full rounded-lg shadow-xl"
              />
              <GlassContainer 
                className="absolute -bottom-6 -right-6 p-4"
                glowOnHover={true}
              >
                <div className="text-white text-sm">
                  <div className="font-semibold">Starting at</div>
                  <div className="text-2xl">$299</div>
                </div>
              </GlassContainer>
            </div>
          </SlideIn>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Product Features</h2>
          </FadeIn>

          <StaggerChildren 
            staggerDelay={0.3} 
            direction="up"
            className="space-y-8"
          >
            {[
              { title: "Advanced AI", desc: "Powered by machine learning" },
              { title: "Cloud Integration", desc: "Seamless synchronization" },
              { title: "Mobile Ready", desc: "Works on all devices" }
            ].map((feature, index) => (
              <div key={feature.title} className={`flex items-center gap-8 ${
                index % 2 === 1 ? 'flex-row-reverse' : ''
              }`}>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-600 text-lg">{feature.desc}</p>
                </div>
                <AnimatedCard 
                  hoverScale={1.03}
                  className="flex-1 p-8 bg-gradient-to-br from-blue-50 to-purple-50"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg" />
                </AnimatedCard>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>
    </div>
  )
}
```

### 6. Loading States with Animations

```tsx
function LoadingCard() {
  return (
    <AnimatedCard className="p-6">
      <StaggerChildren staggerDelay={0.2} direction="fade">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </StaggerChildren>
    </AnimatedCard>
  )
}

function ContentWithLoading({ isLoading, data }: {
  isLoading: boolean
  data?: any[]
}) {
  if (isLoading) {
    return (
      <StaggerChildren staggerDelay={0.1} className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </StaggerChildren>
    )
  }

  return (
    <StaggerChildren staggerDelay={0.15} direction="up" className="space-y-4">
      {data?.map((item, index) => (
        <AnimatedCard key={item.id} hoverScale={1.02}>
          <div className="p-6">
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
        </AnimatedCard>
      ))}
    </StaggerChildren>
  )
}
```

## Performance Tips

1. **Use `once={true}`** for entrance animations to prevent re-triggering on scroll
2. **Limit simultaneous animations** - stagger them instead of running many at once
3. **Prefer `transform` properties** - our components use these for better performance
4. **Consider `will-change: transform`** for frequently animated elements
5. **Use `AnimatePresence`** from Framer Motion for exit animations

## Accessibility

All components respect the user's motion preferences:

```tsx
// The components automatically check for prefers-reduced-motion
// No additional configuration needed

function MyComponent() {
  return (
    <FadeIn>
      <div>This will respect user motion preferences</div>
    </FadeIn>
  )
}
```

## Customization

You can extend the components by passing additional props:

```tsx
<AnimatedCard
  hoverScale={1.1}
  shadowIntensity="2xl"
  glowEffect={true}
  glowColor="rgba(255, 0, 128, 0.3)"
  className="my-custom-styles"
  style={{ background: 'linear-gradient(45deg, #ff0080, #7928ca)' }}
>
  Custom styled card
</AnimatedCard>
```

These examples demonstrate how to effectively use the animation components in real applications. Mix and match them to create engaging user experiences!
