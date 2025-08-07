"use client"

import * as React from "react"
import { 
  ElevatedCard, 
  TiltCard, 
  ExpandableCard, 
  CardSkeleton, 
  FlipCard, 
  GlassCard 
} from "@/components/ui/advanced-card"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CardShowcase() {
  const [showSkeletons, setShowSkeletons] = React.useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Advanced Card Components Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Beautiful card designs with hover effects, tilt animations, expandable content, 
            skeleton loading states, and flip animations
          </p>
        </div>

        {/* Elevated Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Elevated Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Basic Elevated Card */}
            <ElevatedCard elevation={2} hoverElevation={4} className="p-6">
              <h3 className="text-xl font-semibold mb-3">Basic Elevation</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A simple card with subtle shadow that elevates on hover.
              </p>
              <Badge variant="secondary">Hover me</Badge>
            </ElevatedCard>

            {/* Elevated Card with Glow */}
            <ElevatedCard 
              elevation={3} 
              hoverElevation={5} 
              glowEffect={true}
              glowColor="rgba(147, 51, 234, 0.2)"
              className="p-6"
            >
              <h3 className="text-xl font-semibold mb-3">Glow Effect</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Elevated card with a beautiful purple glow on hover.
              </p>
              <Badge variant="outline" className="border-purple-500 text-purple-500">
                Glowing
              </Badge>
            </ElevatedCard>

            {/* High Elevation Card */}
            <ElevatedCard elevation={4} hoverElevation={5} className="p-6">
              <h3 className="text-xl font-semibold mb-3">High Elevation</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Card with higher initial elevation for prominence.
              </p>
              <Badge>Premium</Badge>
            </ElevatedCard>
          </div>
        </section>

        {/* Tilt Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Tilt Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Basic Tilt Card */}
            <TiltCard className="p-6">
              <h3 className="text-xl font-semibold mb-3">Mouse Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This card tilts based on your mouse position. Move your cursor around!
              </p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Interactive</span>
              </div>
            </TiltCard>

            {/* Intense Tilt Card */}
            <TiltCard 
              tiltMaxX={25} 
              tiltMaxY={25} 
              scale={1.05}
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"
            >
              <h3 className="text-xl font-semibold mb-3">Intense Tilt</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Higher tilt angles and scale for dramatic effect.
              </p>
              <Badge variant="destructive">Intense</Badge>
            </TiltCard>

            {/* No Glare Tilt Card */}
            <TiltCard 
              glareEnable={false}
              className="p-6 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20"
            >
              <h3 className="text-xl font-semibold mb-3">No Glare</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Tilt effect without the glare overlay for cleaner look.
              </p>
              <Badge variant="outline" className="border-green-500 text-green-600">
                Clean
              </Badge>
            </TiltCard>
          </div>
        </section>

        {/* Expandable Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Expandable Cards</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Basic Expandable */}
            <ExpandableCard title="Project Details">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  This card expands to show additional content with smooth height transitions.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                    <p className="text-green-600 font-semibold">Active</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</span>
                    <p className="text-blue-600 font-semibold">75%</p>
                  </div>
                </div>
                <Button size="sm" className="mt-4">
                  View Details
                </Button>
              </div>
            </ExpandableCard>

            {/* Expandable with Header Content */}
            <ExpandableCard 
              title="Team Members" 
              headerContent={<Badge>5 members</Badge>}
              defaultExpanded
            >
              <div className="space-y-3">
                {['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Brown'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          </div>
        </section>

        {/* Flip Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Flip Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Hover Flip Card */}
            <FlipCard
              triggerMode="hover"
              frontContent={
                <div className="p-6 h-full flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Frontend</h3>
                  <p className="text-gray-600 dark:text-gray-300">Hover to see details</p>
                </div>
              }
              backContent={
                <div className="p-6 h-full flex flex-col justify-center">
                  <h3 className="text-xl font-semibold mb-4">Skills & Tech</h3>
                  <div className="space-y-2">
                    <Badge className="mr-2">React</Badge>
                    <Badge className="mr-2">TypeScript</Badge>
                    <Badge className="mr-2">Tailwind CSS</Badge>
                    <Badge className="mr-2">Framer Motion</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                    Building beautiful, interactive user interfaces
                  </p>
                </div>
              }
            />

            {/* Click Flip Card */}
            <FlipCard
              triggerMode="click"
              frontContent={
                <div className="p-6 h-full flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Backend</h3>
                  <p className="text-gray-600 dark:text-gray-300">Click to flip</p>
                </div>
              }
              backContent={
                <div className="p-6 h-full flex flex-col justify-center">
                  <h3 className="text-xl font-semibold mb-4">Technologies</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="mr-2">Node.js</Badge>
                    <Badge variant="secondary" className="mr-2">Python</Badge>
                    <Badge variant="secondary" className="mr-2">PostgreSQL</Badge>
                    <Badge variant="secondary" className="mr-2">Redis</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                    Robust server-side solutions and APIs
                  </p>
                </div>
              }
            />

            {/* Vertical Flip Card */}
            <FlipCard
              triggerMode="hover"
              flipDirection="vertical"
              frontContent={
                <div className="p-6 h-full flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                  <p className="text-gray-600 dark:text-gray-300">Vertical flip</p>
                </div>
              }
              backContent={
                <div className="p-6 h-full flex flex-col justify-center">
                  <h3 className="text-xl font-semibold mb-4">Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Users</span>
                      <span className="font-semibold">12,543</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions</span>
                      <span className="font-semibold">45,921</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounce Rate</span>
                      <span className="font-semibold">32.1%</span>
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {/* Glass Cards Section */}
        <section className="mb-16">
          <div className="relative">
            {/* Background for glass effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-3xl opacity-30 -z-10"></div>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-8">Glass Morphism Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <GlassCard blurIntensity="light" opacity="light" className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-white">Light Glass</h3>
                  <p className="text-gray-200 mb-4">
                    Subtle glass effect with light blur and opacity.
                  </p>
                  <Badge variant="outline" className="border-white/30 text-white">
                    Elegant
                  </Badge>
                </GlassCard>

                <GlassCard blurIntensity="medium" opacity="medium" className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-white">Medium Glass</h3>
                  <p className="text-gray-200 mb-4">
                    Balanced glass effect for modern interfaces.
                  </p>
                  <Badge variant="outline" className="border-white/30 text-white">
                    Modern
                  </Badge>
                </GlassCard>

                <GlassCard blurIntensity="strong" opacity="strong" className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-white">Strong Glass</h3>
                  <p className="text-gray-200 mb-4">
                    Intense glass effect for dramatic presentations.
                  </p>
                  <Badge variant="outline" className="border-white/30 text-white">
                    Dramatic
                  </Badge>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Loading Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skeleton Loading States</h2>
            <Button 
              onClick={() => setShowSkeletons(!showSkeletons)}
              variant="outline"
            >
              {showSkeletons ? 'Show Content' : 'Show Skeletons'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showSkeletons ? (
              <>
                <CardSkeleton />
                <CardSkeleton showAvatar={true} lines={4} />
                <CardSkeleton showAvatar={true} showActions={true} lines={2} />
              </>
            ) : (
              <>
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Standard Card</CardTitle>
                    <CardDescription>This is what the content looks like when loaded</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      JD
                    </div>
                    <div>
                      <CardTitle>John Doe</CardTitle>
                      <CardDescription>Software Engineer</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Working on next-generation web applications with modern technologies.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Passionate about creating beautiful user experiences.
                    </p>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      AS
                    </div>
                    <div>
                      <CardTitle>Alice Smith</CardTitle>
                      <CardDescription>Product Designer</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Designing intuitive and accessible interfaces.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button size="sm" className="mr-2">Connect</Button>
                    <Button size="sm" variant="outline">Message</Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </div>
        </section>

        {/* Combined Effects Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Combined Effects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Tilt + Glow */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Tilt + Elevation + Glow</h3>
              <TiltCard className="p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900/20 dark:via-slate-800 dark:to-purple-900/20 card-hover-lift">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">✨</span>
                  </div>
                  <h4 className="text-2xl font-bold mb-4">Premium Card</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Combining multiple effects for maximum visual impact
                  </p>
                  <Badge className="px-4 py-2 text-sm">
                    Premium Experience
                  </Badge>
                </div>
              </TiltCard>
            </div>

            {/* Expandable + Glass */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Expandable Glass Card</h3>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-20 -z-10"></div>
                <ExpandableCard 
                  title="Glass Expandable" 
                  className="backdrop-blur-md bg-white/10 border-white/20"
                  headerContent={<Badge variant="outline" className="border-white/30">Premium</Badge>}
                >
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-200">
                      This card combines the expandable functionality with glass morphism effects.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                        <span className="text-sm font-medium">Feature 1</span>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Advanced animations</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                        <span className="text-sm font-medium">Feature 2</span>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Glass morphism</p>
                      </div>
                    </div>
                  </div>
                </ExpandableCard>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
