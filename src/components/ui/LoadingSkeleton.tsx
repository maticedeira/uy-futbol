interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-8 h-4" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-8 h-4" />
      </div>
    </div>
  )
}

export function StandingsRowSkeleton() {
  return (
    <div className="flex items-center gap-2 py-3 px-2">
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-6 rounded-full" />
      <Skeleton className="w-32 h-4 flex-1" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
    </div>
  )
}
