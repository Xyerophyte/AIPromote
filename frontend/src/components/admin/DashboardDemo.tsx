'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedCounter, AnimatedPercentage } from '@/components/ui/animated-counter'
import { AnimatedProgress, CircularProgress, AnimatedGauge } from '@/components/ui/animated-progress'
import { AnimatedBarChart, AnimatedLineChart, AnimatedDonutChart } from '@/components/ui/animated-chart'
import { AnimatedTooltip, StatCardWithTooltip } from '@/components/ui/animated-tooltip'
import { ChartSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  TrendingUp,
  Play,
  RotateCcw
} from 'lucide-react'

export default function DashboardDemo() {
  const [showDemo, setShowDemo] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  const resetAnimations = () => {
    setAnimationKey(prev => prev + 1)
    setShowDemo(false)
    setTimeout(() => setShowDemo(true), 100)
  }

  const sampleData = [
    { label: 'Jan', value: 120, color: '#3b82f6' },
    { label: 'Feb', value: 135, color: '#8b5cf6' },
    { label: 'Mar', value: 148, color: '#10b981' },
    { label: 'Apr', value: 162, color: '#f59e0b' },
    { label: 'May', value: 180, color: '#ef4444' }
  ]

  const lineData = [
    { x: 1, y: 120, label: 'Week 1: 120 users' },
    { x: 2, y: 135, label: 'Week 2: 135 users' },
    { x: 3, y: 148, label: 'Week 3: 148 users' },
    { x: 4, y: 162, label: 'Week 4: 162 users' },
    { x: 5, y: 180, label: 'Current: 180 users' }
  ]

  const donutData = [
    { label: 'Blog Posts', value: 45, color: '#8b5cf6' },
    { label: 'Social Media', value: 30, color: '#06d6a0' },
    { label: 'Emails', value: 15, color: '#f59e0b' },
    { label: 'Other', value: 10, color: '#ef4444' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Dashboard Animations
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Featuring animated counters, progress bars, charts, tooltips, and skeleton screens
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setShowDemo(true)} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Demo
            </Button>
            <Button onClick={resetAnimations} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset Animations
            </Button>
          </div>
        </motion.div>

        {!showDemo ? (
          // Skeleton Loading State
          <motion.div
            key={`skeleton-${animationKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ChartSkeleton key={i} type="bar" />
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton type="line" />
              <ChartSkeleton type="donut" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`content-${animationKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Stats Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <StatCardWithTooltip
                  title="Total Users"
                  value={2847}
                  change={12}
                  changeLabel="Growth in new user signups"
                  icon={<Users className="h-6 w-6" />}
                  color="blue"
                  tooltip="Total number of registered users on the platform"
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <StatCardWithTooltip
                  title="Content Created"
                  value={1549}
                  change={8}
                  changeLabel="Increase in content generation"
                  icon={<FileText className="h-6 w-6" />}
                  color="green"
                  tooltip="Total content pieces generated using AI tools"
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <StatCardWithTooltip
                  title="Posts Published"
                  value={892}
                  change={15}
                  changeLabel="More posts published to social platforms"
                  icon={<BarChart3 className="h-6 w-6" />}
                  color="purple"
                  tooltip="Number of posts successfully published across all platforms"
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <StatCardWithTooltip
                  title="Active Plans"
                  value={456}
                  change={5}
                  changeLabel="Growth in active paid subscriptions"
                  icon={<Shield className="h-6 w-6" />}
                  color="orange"
                  tooltip="Number of users with active premium subscriptions"
                />
              </motion.div>
            </motion.div>

            {/* Charts Section */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {/* Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Growth</h3>
                  <AnimatedTooltip content="User registration growth by month">
                    <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold cursor-help">
                      ?
                    </div>
                  </AnimatedTooltip>
                </div>
                <AnimatedBarChart data={sampleData} height={200} />
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Growth Trend</h3>
                  <AnimatedTooltip content="Weekly user registration trend">
                    <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold cursor-help">
                      ?
                    </div>
                  </AnimatedTooltip>
                </div>
                <AnimatedLineChart 
                  data={lineData}
                  width={400}
                  height={200}
                  strokeColor="#10b981"
                />
              </div>
            </motion.div>

            {/* More Charts and Progress */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {/* Donut Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Content Distribution</h3>
                <div className="flex justify-center">
                  <AnimatedDonutChart
                    data={donutData}
                    size={180}
                    thickness={20}
                  />
                </div>
              </div>

              {/* Circular Progress */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Goal Progress</h3>
                <div className="flex justify-center">
                  <CircularProgress
                    value={75}
                    size={120}
                    color="#8b5cf6"
                  />
                </div>
              </div>

              {/* Gauge */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health</h3>
                <div className="flex justify-center">
                  <AnimatedGauge
                    value={87}
                    max={100}
                    label="Health Score"
                    size={140}
                    colors={['#ef4444', '#f59e0b', '#10b981']}
                  />
                </div>
              </div>
            </motion.div>

            {/* Progress Bars */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Server Performance</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU Usage</span>
                    <AnimatedTooltip content="Current CPU utilization across all cores">
                      <span className="cursor-help">65%</span>
                    </AnimatedTooltip>
                  </div>
                  <AnimatedProgress value={65} color="blue" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Usage</span>
                    <AnimatedTooltip content="RAM usage including cached data">
                      <span className="cursor-help">78%</span>
                    </AnimatedTooltip>
                  </div>
                  <AnimatedProgress value={78} color="yellow" delay={0.2} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Storage</span>
                    <AnimatedTooltip content="Disk space utilization">
                      <span className="cursor-help">42%</span>
                    </AnimatedTooltip>
                  </div>
                  <AnimatedProgress value={42} color="green" delay={0.4} />
                </div>
              </div>
            </motion.div>

            {/* Counter Demo */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Animated Counters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    <AnimatedCounter value={12847} duration={2} />
                  </div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    <AnimatedPercentage value={98.5} duration={2.5} delay={0.5} />
                  </div>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    <AnimatedCounter 
                      value={2847} 
                      duration={3} 
                      delay={1}
                      format={(val) => `${Math.round(val).toLocaleString()}+`}
                    />
                  </div>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
