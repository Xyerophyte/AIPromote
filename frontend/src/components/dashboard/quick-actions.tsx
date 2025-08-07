import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'

const QuickActions = React.memo(() => {
  const actions = [
    {
      title: 'Start New Intake',
      description: 'Complete the founder intake form for a new startup',
      href: '/intake',
      variant: 'default' as const
    },
    {
      title: 'Generate Content',
      description: 'Create AI-powered social media content',
      href: '/content/generate',
      variant: 'secondary' as const
    },
    {
      title: 'View Analytics',
      description: 'Track performance and engagement metrics',
      href: '/analytics',
      variant: 'outline' as const
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {actions.map((action) => (
        <div key={action.title} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
          <p className="text-gray-600 mb-4">{action.description}</p>
          <Button asChild size="sm" variant={action.variant}>
            <Link href={action.href}>{action.title}</Link>
          </Button>
        </div>
      ))}
    </div>
  )
})

QuickActions.displayName = 'QuickActions'

export default QuickActions
