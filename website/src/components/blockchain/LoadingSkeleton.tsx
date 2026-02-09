/**
 * LoadingSkeleton Component
 * Displays skeleton screens for better perceived performance during loading
 */

'use client'

export interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'balance'
  width?: string | number
  height?: string | number
  count?: number
  className?: string
}

export function LoadingSkeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-800 rounded'

  const variantClasses: Record<string, string> = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    balance: 'h-12 w-48',
  }

  const getSkeletonStyle = () => {
    const style: Record<string, string> = {}
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height
    return style
  }

  const renderSkeleton = (index: number) => (
    <div
      key={index}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      style={getSkeletonStyle()}
      aria-hidden="true"
    />
  )

  return (
    <>
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </>
  )
}

/**
 * Blockchain-specific loading skeletons
 */

export function WalletConnectionSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6" aria-busy="true">
      <div className="flex items-center justify-between mb-4">
        <LoadingSkeleton variant="rectangular" width={200} height={32} />
        <LoadingSkeleton variant="rectangular" width={120} height={40} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded p-4">
            <LoadingSkeleton variant="text" count={2} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StakingSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6" aria-busy="true">
      <LoadingSkeleton variant="rectangular" width={150} height={28} className="mb-6" />
      <div className="space-y-4">
        <LoadingSkeleton variant="rectangular" height={60} />
        <LoadingSkeleton variant="rectangular" height={60} />
        <LoadingSkeleton variant="rectangular" height={100} />
      </div>
    </div>
  )
}

export function BalanceCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6" aria-busy="true">
      <LoadingSkeleton variant="text" className="mb-2" />
      <LoadingSkeleton variant="balance" className="mb-4" />
      <LoadingSkeleton variant="rectangular" width={200} height={40} />
    </div>
  )
}

export function ItemStoreSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <LoadingSkeleton variant="rectangular" width={150} height={24} />
            <LoadingSkeleton variant="rectangular" width={100} height={32} />
          </div>
          <LoadingSkeleton variant="text" count={3} />
          <LoadingSkeleton variant="rectangular" width={180} height={40} className="mt-4" />
        </div>
      ))}
    </div>
  )
}
