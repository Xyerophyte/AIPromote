"use client"

import * as React from "react"
import { 
  ElevatedCard, 
  TiltCard, 
  ExpandableCard, 
  CardSkeleton, 
  FlipCard, 
  GlassCard 
} from "./advanced-card"
import { Button } from "./button"
import { Badge } from "./badge"

/**
 * Example implementations of advanced card components for real-world use cases
 */

// Product Card with Tilt Effect
export function ProductCard({ product }: { product: any }) {
  return (
    <TiltCard className="p-0 overflow-hidden max-w-sm">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <Badge 
          className="absolute top-3 right-3"
          variant={product.inStock ? "default" : "destructive"}
        >
          {product.inStock ? "In Stock" : "Out of Stock"}
        </Badge>
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            ${product.price}
          </span>
          <Button size="sm">
            Add to Cart
          </Button>
        </div>
      </div>
    </TiltCard>
  )
}

// Team Member Card with Flip Animation
export function TeamMemberCard({ member }: { member: any }) {
  return (
    <FlipCard
      triggerMode="hover"
      className="max-w-sm"
      frontContent={
        <div className="p-6 h-full flex flex-col items-center justify-center text-center">
          <img 
            src={member.avatar} 
            alt={member.name}
            className="w-24 h-24 rounded-full object-cover mb-4"
          />
          <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{member.role}</p>
          <Badge variant="outline">{member.department}</Badge>
        </div>
      }
      backContent={
        <div className="p-6 h-full flex flex-col justify-center">
          <h4 className="font-semibold mb-4">Skills & Expertise</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {member.skills.map((skill: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {member.bio}
          </p>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Contact
            </Button>
            <Button size="sm">
              View Profile
            </Button>
          </div>
        </div>
      }
    />
  )
}

// Feature Card with Elevation and Glow
export function FeatureCard({ feature }: { feature: any }) {
  return (
    <ElevatedCard 
      elevation={2} 
      hoverElevation={4}
      glowEffect={true}
      glowColor={feature.glowColor || "rgba(59, 130, 246, 0.2)"}
      className="p-6 max-w-sm text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <feature.icon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {feature.description}
      </p>
      
      <Button variant="outline" size="sm">
        Learn More
      </Button>
    </ElevatedCard>
  )
}

// FAQ Card with Expandable Content
export function FAQCard({ faq }: { faq: any }) {
  return (
    <ExpandableCard 
      title={faq.question}
      headerContent={
        <Badge variant="outline" className="ml-2">
          {faq.category}
        </Badge>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          {faq.answer}
        </p>
        
        {faq.links && faq.links.length > 0 && (
          <div>
            <h5 className="font-medium mb-2">Related Links:</h5>
            <ul className="space-y-1">
              {faq.links.map((link: any, i: number) => (
                <li key={i}>
                  <a 
                    href={link.url} 
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {link.title} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center gap-4 pt-2">
          <Button size="sm" variant="ghost">
            👍 Helpful ({faq.helpful || 0})
          </Button>
          <Button size="sm" variant="ghost">
            👎 Not helpful
          </Button>
        </div>
      </div>
    </ExpandableCard>
  )
}

// Loading States with Skeletons
export function ProductGridLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton 
          key={i}
          className="h-80"
          showAvatar={false}
          showActions={true}
          lines={3}
        />
      ))}
    </div>
  )
}

export function TeamGridLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton 
          key={i}
          className="h-64"
          showAvatar={true}
          showActions={true}
          lines={2}
        />
      ))}
    </div>
  )
}

// Dashboard Stats Card with Glass Effect
export function StatsCard({ stat }: { stat: any }) {
  return (
    <GlassCard 
      blurIntensity="medium" 
      opacity="medium"
      className="p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {stat.label}
        </h3>
        <stat.icon className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold">{stat.value}</span>
        {stat.change && (
          <Badge 
            variant={stat.change > 0 ? "default" : "destructive"}
            className="text-xs"
          >
            {stat.change > 0 ? "+" : ""}{stat.change}%
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        vs last {stat.period || "month"}
      </p>
    </GlassCard>
  )
}

// Notification Card with Custom Animation
export function NotificationCard({ notification }: { notification: any }) {
  const [isRead, setIsRead] = React.useState(notification.read)
  
  return (
    <ElevatedCard
      elevation={1}
      hoverElevation={2}
      className={`p-4 cursor-pointer transition-all duration-200 ${
        !isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
      onClick={() => setIsRead(true)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <notification.icon className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium truncate">
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500">
              {notification.time}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {notification.message}
          </p>
          
          {notification.actions && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action: any, i: number) => (
                <Button key={i} size="sm" variant="ghost">
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {!isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </ElevatedCard>
  )
}

// Project Card with Combined Effects
export function ProjectCard({ project }: { project: any }) {
  return (
    <TiltCard className="p-0 overflow-hidden max-w-sm card-hover-lift">
      <div className="h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4">
          <Badge variant="outline" className="border-white/50 text-white">
            {project.status}
          </Badge>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <div className="flex -space-x-2">
            {project.team.map((member: any, i: number) => (
              <img
                key={i}
                src={member.avatar}
                alt={member.name}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
              />
            ))}
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {project.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {project.tech.slice(0, 3).map((tech: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.tech.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tech.length - 3}
              </Badge>
            )}
          </div>
          
          <Button size="sm" variant="outline">
            View Project
          </Button>
        </div>
      </div>
    </TiltCard>
  )
}

// Usage Example Components
export const AdvancedCardExamples = {
  ProductCard,
  TeamMemberCard,
  FeatureCard,
  FAQCard,
  ProductGridLoader,
  TeamGridLoader,
  StatsCard,
  NotificationCard,
  ProjectCard
}
