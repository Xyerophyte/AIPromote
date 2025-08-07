"use client"

import { 
  FadeIn, 
  SlideIn, 
  StaggerChildren,
  Typewriter,
  AnimatedGradient,
  FloatingParticles,
  ParallaxContainer
} from "@/components/animations"
import { AnimatedButtonDemo } from "@/components/ui/animated-button-demo"

export default function TestAnimationsPage() {
  return (
    <div className="min-h-screen">
      <AnimatedGradient className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-16">
          
          <section className="text-center">
            <h1 className="text-4xl font-bold mb-8">Animation Components Test</h1>
            
            {/* Typewriter Test */}
            <div className="mb-8">
              <h2 className="text-2xl mb-4">Typewriter Animation:</h2>
              <Typewriter 
                text="This text is being typed out character by character!" 
                speed={0.05}
                className="text-lg text-blue-600"
              />
            </div>

            {/* FadeIn Test */}
            <FadeIn delay={2} className="mb-8">
              <h2 className="text-2xl mb-4">FadeIn Animation:</h2>
              <p className="text-lg">This text fades in after a delay!</p>
            </FadeIn>

            {/* SlideIn Test */}
            <SlideIn direction="up" delay={3} className="mb-8">
              <h2 className="text-2xl mb-4">SlideIn Animation:</h2>
              <p className="text-lg">This text slides in from below!</p>
            </SlideIn>

            {/* StaggerChildren Test */}
            <div className="mb-8">
              <h2 className="text-2xl mb-4">StaggerChildren Animation:</h2>
              <StaggerChildren initialDelay={4} staggerDelay={0.3} className="flex gap-4 justify-center">
                <div className="p-4 bg-blue-100 rounded">Item 1</div>
                <div className="p-4 bg-purple-100 rounded">Item 2</div>
                <div className="p-4 bg-pink-100 rounded">Item 3</div>
              </StaggerChildren>
            </div>

          </section>

          {/* Floating Particles Test */}
          <section className="relative h-64 bg-blue-50 rounded-lg overflow-hidden">
            <FloatingParticles 
              count={10} 
              colors={["bg-blue-300", "bg-purple-300", "bg-pink-300"]} 
            />
            <div className="relative z-10 flex items-center justify-center h-full">
              <h2 className="text-2xl font-bold">Floating Particles Background</h2>
            </div>
          </section>

          {/* Parallax Test */}
          <section className="h-96">
            <h2 className="text-2xl mb-4 text-center">Parallax Container (scroll to see effect):</h2>
            <ParallaxContainer speed={0.5} className="h-64 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg flex items-center justify-center">
              <p className="text-xl font-bold">This moves with parallax effect when scrolling!</p>
            </ParallaxContainer>
          </section>

        </div>
      </AnimatedGradient>
      
      {/* Animated Buttons Section */}
      <section className="bg-white py-16">
        <AnimatedButtonDemo />
      </section>
    </div>
  )
}
