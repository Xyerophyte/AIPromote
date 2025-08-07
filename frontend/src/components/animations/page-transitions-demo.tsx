"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  PageTransition,
  AdvancedPageTransition,
  SharedElement,
  RouteProgress,
  PageAnimationProvider,
  usePageAnimation,
  useTemporaryTransition,
  childVariants,
  staggerChildrenVariants
} from "./index"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DemoCardProps {
  title: string
  description: string
  effect: string
  type: "basic" | "advanced"
  direction?: "left" | "right" | "up" | "down"
}

const DemoCard: React.FC<DemoCardProps> = ({ title, description, effect, type, direction = "right" }) => {
  const { setTemporaryTransition } = useTemporaryTransition()

  const handleDemo = () => {
    setTemporaryTransition({
      transitionType: type,
      effect,
      direction,
      duration: 0.8
    }, 2000)
  }

  return (
    <motion.div variants={childVariants}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={type === "advanced" ? "default" : "secondary"}>
              {type}
            </Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDemo} className="w-full">
            Try {title}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const ControlPanel: React.FC = () => {
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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Animation Controls</CardTitle>
        <CardDescription>
          Customize page transition settings in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Transition Type</label>
            <select 
              value={transitionType} 
              onChange={(e) => setTransitionType(e.target.value as "basic" | "advanced")}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Effect</label>
            <select 
              value={effect} 
              onChange={(e) => setEffect(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            >
              {transitionType === "basic" ? (
                <>
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="scale">Scale</option>
                  <option value="mixed">Mixed</option>
                </>
              ) : (
                <>
                  <option value="curtain">Curtain</option>
                  <option value="iris">Iris</option>
                  <option value="wave">Wave</option>
                  <option value="flip">Flip</option>
                  <option value="zoom">Zoom</option>
                  <option value="slide-stack">Slide Stack</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Direction</label>
            <select 
              value={direction} 
              onChange={(e) => setDirection(e.target.value as any)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Duration (s)</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-xs text-gray-500">{duration}s</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="progress-bar"
            checked={enableProgressBar}
            onChange={(e) => setEnableProgressBar(e.target.checked)}
          />
          <label htmlFor="progress-bar" className="text-sm">
            Enable Route Progress Bar
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

const SharedElementDemo: React.FC = () => {
  const [selectedCard, setSelectedCard] = React.useState<number | null>(null)

  const cards = [
    { id: 1, title: "Shared Element 1", color: "bg-blue-500" },
    { id: 2, title: "Shared Element 2", color: "bg-green-500" },
    { id: 3, title: "Shared Element 3", color: "bg-purple-500" },
  ]

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Shared Element Transitions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <SharedElement
            key={card.id}
            layoutId={`shared-card-${card.id}`}
            className={cn(
              "p-6 rounded-lg cursor-pointer text-white transition-colors",
              card.color,
              selectedCard === card.id && "ring-4 ring-white/50"
            )}
            onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
          >
            <motion.h4 
              className="font-semibold"
              layout
            >
              {card.title}
            </motion.h4>
            <motion.p 
              className="text-sm opacity-90 mt-2"
              layout
            >
              Click to see shared element animation
            </motion.p>
            
            {selectedCard === card.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-4 p-3 bg-white/20 rounded"
              >
                <p className="text-xs">
                  This content animates in when the card is selected, 
                  demonstrating smooth shared element transitions.
                </p>
              </motion.div>
            )}
          </SharedElement>
        ))}
      </div>
    </div>
  )
}

export const PageTransitionsDemo: React.FC = () => {
  const demos: DemoCardProps[] = [
    {
      title: "Fade Transition",
      description: "Simple opacity-based page transition",
      effect: "fade",
      type: "basic"
    },
    {
      title: "Slide Transition", 
      description: "Slide pages in from different directions",
      effect: "slide",
      type: "basic",
      direction: "right"
    },
    {
      title: "Scale Transition",
      description: "Scale pages in and out smoothly",
      effect: "scale", 
      type: "basic"
    },
    {
      title: "Mixed Transition",
      description: "Combination of fade, scale, and movement",
      effect: "mixed",
      type: "basic"
    },
    {
      title: "Curtain Effect",
      description: "Pages reveal like opening curtains",
      effect: "curtain",
      type: "advanced"
    },
    {
      title: "Iris Effect",
      description: "Circular reveal transition",
      effect: "iris",
      type: "advanced"
    },
    {
      title: "Wave Effect",
      description: "Fluid wave-like page transitions",
      effect: "wave",
      type: "advanced"
    },
    {
      title: "Flip Effect",
      description: "3D flip transition between pages",
      effect: "flip",
      type: "advanced"
    },
    {
      title: "Zoom Effect", 
      description: "Zoom and blur page transitions",
      effect: "zoom",
      type: "advanced"
    },
    {
      title: "Slide Stack",
      description: "Layered sliding with scale effects",
      effect: "slide-stack",
      type: "advanced"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        variants={staggerChildrenVariants}
        initial="initial"
        animate="animate"
        className="space-y-8"
      >
        <motion.div variants={childVariants}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Page Transitions Demo</h1>
            <p className="text-gray-600">
              Explore smooth page transitions with Framer Motion
            </p>
          </div>
        </motion.div>

        <motion.div variants={childVariants}>
          <ControlPanel />
        </motion.div>

        <motion.div variants={childVariants}>
          <SharedElementDemo />
        </motion.div>

        <motion.div variants={childVariants}>
          <h2 className="text-2xl font-semibold mb-6">Available Transitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demos.map((demo, index) => (
              <DemoCard key={index} {...demo} />
            ))}
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Guide</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm">
              <h4>Basic Setup:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Wrap your app with PageAnimationProvider
<PageAnimationProvider>
  <App />
</PageAnimationProvider>

// Individual page wrapper
<PageTransition type="mixed">
  <YourPageContent />
</PageTransition>`}
              </pre>
              
              <h4>Advanced Features:</h4>
              <ul className="text-sm">
                <li>Automatic route change detection</li>
                <li>Reduced motion support</li>
                <li>Customizable timing and easing</li>
                <li>Progress bar indicators</li>
                <li>Shared element continuity</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
