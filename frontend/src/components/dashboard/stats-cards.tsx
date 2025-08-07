import React from 'react'

interface StatsCardsProps {
  stats?: {
    totalStartups: number
    activeStartups: number
    totalContent: number
    publishedContent: number
  }
}

const StatsCards = React.memo(({ stats }: StatsCardsProps) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      title: 'Total Startups',
      value: stats.totalStartups,
      color: 'text-blue-600'
    },
    {
      title: 'Active Startups', 
      value: stats.activeStartups,
      color: 'text-green-600'
    },
    {
      title: 'Total Content',
      value: stats.totalContent,
      color: 'text-purple-600'
    },
    {
      title: 'Published Content',
      value: stats.publishedContent,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <h3 className={`text-lg font-semibold mb-2 ${item.color}`}>
            {item.title}
          </h3>
          <p className="text-3xl font-bold">{item.value}</p>
        </div>
      ))}
    </div>
  )
})

StatsCards.displayName = 'StatsCards'

export default StatsCards
