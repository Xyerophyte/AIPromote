import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md",
        "bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  )
}

// Dashboard skeleton with multiple cards
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  )
}

// Form skeleton for intake forms
function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Enhanced dashboard skeleton with staggered animations
function EnhancedDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in-0 duration-700">
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-top-4 duration-500 delay-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="rounded-lg border p-4 bg-white shadow-sm animate-in slide-in-from-top-4 duration-500"
            style={{ animationDelay: `${200 + i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-top-4 duration-500 delay-300">
        <div className="bg-white rounded-lg border p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

// Chart skeleton with animated bars
function ChartSkeleton({ type = 'bar' }: { type?: 'bar' | 'line' | 'donut' }) {
  if (type === 'bar') {
    return (
      <div className="p-4">
        <div className="flex items-end justify-between space-x-2" style={{ height: '200px' }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const height = Math.random() * 150 + 30
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
                  style={{ 
                    height: `${height}px`,
                    backgroundSize: '200% 100%',
                    animationDelay: `${i * 100}ms`
                  }}
                />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (type === 'donut') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="relative animate-in zoom-in-50 duration-600">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  // Line chart
  return (
    <div className="p-4">
      <svg width="400" height="200" className="overflow-visible">
        <path
          d="M 20 180 Q 80 120 140 140 T 260 100 T 380 80"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
          className="animate-pulse"
          style={{ animationDuration: '2s' }}
        />
      </svg>
    </div>
  )
}

export { Skeleton, DashboardSkeleton, FormSkeleton, EnhancedDashboardSkeleton, ChartSkeleton }
