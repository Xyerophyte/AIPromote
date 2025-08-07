"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Target, BarChart3, Rocket, Brain, Check } from "lucide-react"
import { 
  FadeIn, 
  SlideIn, 
  StaggerChildren,
  Typewriter,
  AnimatedGradient,
  FloatingParticles,
  ParallaxContainer
} from "@/components/animations"
import EnhancedNavigation from "@/components/navigation/enhanced-navigation"

export default function Home() {
  return (
    <AnimatedGradient className="min-h-screen">
      {/* Enhanced Navigation */}
      <EnhancedNavigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Floating Particles */}
        <FloatingParticles 
          count={15} 
          colors={["bg-blue-300/30", "bg-purple-300/30", "bg-pink-300/30", "bg-indigo-300/30"]} 
          className="z-0"
        />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <FadeIn delay={0.2} className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              <Typewriter 
                text="AI-Powered Marketing" 
                speed={0.1}
                className="block mb-2"
              />
              <span className="block text-blue-600">
                <Typewriter 
                  text="Made Simple" 
                  delay={2}
                  speed={0.15}
                  className="animate-pulse-soft"
                />
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={4} direction="up" className="mb-8">
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your startup&apos;s marketing with AI-generated strategies, content, and campaigns. 
              Get professional-grade marketing materials in <span className="font-semibold text-blue-600 animate-pulse-soft">minutes, not months</span>.
            </p>
          </FadeIn>
          
          <SlideIn direction="up" delay={4.5} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-transform duration-200"
                asChild
              >
                <Link href="/intake">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg hover:scale-105 transition-transform duration-200"
                asChild
              >
                <Link href="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </div>
          </SlideIn>
          
          <StaggerChildren 
            initialDelay={5} 
            staggerDelay={0.2} 
            className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500"
          >
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              5-minute setup
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              AI-powered results
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        {/* Parallax Background decoration */}
        <ParallaxContainer speed={0.3} className="absolute inset-0">
          <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 animate-float"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-20 animate-bounce-subtle"></div>
        </ParallaxContainer>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From strategy to execution, AIPromote handles your entire marketing workflow with cutting-edge AI technology
            </p>
          </FadeIn>
          
          <StaggerChildren staggerDelay={0.2} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-2xl hover:scale-105 hover:border-blue-300 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">AI Strategy Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                Get custom marketing strategies tailored to your startup, industry, and target audience using advanced AI algorithms.
              </p>
            </div>
            
            <div className="group p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-2xl hover:scale-105 hover:border-purple-300 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-600 transition-colors">Content Creation</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate engaging posts, blogs, and marketing copy optimized for each platform with AI-powered creativity.
              </p>
            </div>
            
            <div className="group p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-2xl hover:scale-105 hover:border-green-300 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">Automated Publishing</h3>
              <p className="text-gray-600 leading-relaxed">
                Schedule and publish content across all your social media channels automatically with smart timing optimization.
              </p>
            </div>
            
            <div className="group p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-2xl hover:scale-105 hover:border-orange-300 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors">Performance Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track engagement, reach, and conversions with detailed analytics dashboards and actionable insights.
              </p>
            </div>
            
            <div className="group p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-2xl hover:scale-105 hover:border-red-300 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-red-600 transition-colors">Smart Optimization</h3>
              <p className="text-gray-600 leading-relaxed">
                AI continuously learns and optimizes your campaigns for better performance and higher conversion rates.
              </p>
            </div>
            
            <div className="group p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-2xl hover:scale-105 hover:border-pink-300 transition-all duration-300 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-pink-600 transition-colors">Brand Consistency</h3>
              <p className="text-gray-600 leading-relaxed">
                Maintain consistent voice, tone, and messaging across all marketing materials with AI-powered brand guidelines.
              </p>
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Plan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>
          </FadeIn>
          
          <StaggerChildren staggerDelay={0.2} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">5 AI-generated strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Email support</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border-2 border-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Unlimited AI strategies</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Team collaboration</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Trial
              </Button>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Everything in Professional</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Dedicated support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">SLA guarantee</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Touch</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <StaggerChildren staggerDelay={0.1} className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Support</h3>
                  <p className="text-gray-600">
                    Our intelligent support system provides instant answers to common questions and routes complex queries to our expert team.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Response</h3>
                  <p className="text-gray-600">
                    We typically respond to inquiries within 2 hours during business days, and within 24 hours on weekends.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Solutions</h3>
                  <p className="text-gray-600">
                    Every business is unique. We provide tailored solutions and strategies that fit your specific needs and goals.
                  </p>
                </div>
              </div>
            </StaggerChildren>
            
            <SlideIn direction="right" className="bg-gray-50 p-8 rounded-2xl">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>
                
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200">
                  Send Message
                  <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ParallaxContainer speed={0.2} className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Floating particles in CTA */}
        <FloatingParticles 
          count={8} 
          colors={["bg-white/20", "bg-blue-200/30", "bg-purple-200/30"]} 
          className="absolute inset-0"
        />
        
        <FadeIn className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of startups already using AI to accelerate their growth.
          </p>
          <SlideIn direction="up" delay={0.5}>
            <Button 
              size="lg" 
              variant="secondary" 
              className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-gray-50 hover:scale-105 transition-transform duration-200"
              asChild
            >
              <Link href="/intake">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SlideIn>
        </FadeIn>
      </ParallaxContainer>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6" />
              <span className="text-xl font-bold">AIPromote</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2025 AIPromote. All rights reserved. Powered by AI, built for startups.
          </div>
        </div>
      </footer>
    </AnimatedGradient>
  );
}
