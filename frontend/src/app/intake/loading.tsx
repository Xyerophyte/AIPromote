import { FormSkeleton } from "@/components/ui/skeleton"

export default function IntakeLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg w-40"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <FormSkeleton />
      </div>

      <div className="flex justify-between items-center pt-6 border-t animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded w-28"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}
