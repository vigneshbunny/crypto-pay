import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// Shimmer effect component
function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}

// Balance skeleton with shimmer
function BalanceSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerSkeleton className="h-4 w-20" />
      <ShimmerSkeleton className="h-6 w-16" />
    </div>
  )
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="space-y-3">
        <ShimmerSkeleton className="h-4 w-3/4" />
        <ShimmerSkeleton className="h-6 w-1/2" />
        <ShimmerSkeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

// Transaction skeleton
function TransactionSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
      <ShimmerSkeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-4 w-3/4" />
        <ShimmerSkeleton className="h-3 w-1/2" />
      </div>
      <div className="text-right space-y-1">
        <ShimmerSkeleton className="h-4 w-16 ml-auto" />
        <ShimmerSkeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  )
}

// QR Code skeleton
function QRCodeSkeleton({ size = 256 }: { size?: number }) {
  return (
    <div
      className="bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center p-4 mx-auto"
      style={{ width: size, height: size }}
    >
      <div className="space-y-3 text-center w-full">
        <ShimmerSkeleton className="mx-auto rounded-xl" style={{ width: size * 0.8, height: size * 0.8 }} />
        <ShimmerSkeleton className="mx-auto" style={{ width: size * 0.6, height: 16 }} />
        <ShimmerSkeleton className="mx-auto" style={{ width: size * 0.4, height: 12 }} />
      </div>
    </div>
  );
}

// Button skeleton
function ButtonSkeleton() {
  return (
    <ShimmerSkeleton className="h-12 w-full rounded-xl" />
  )
}

// Input skeleton
function InputSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerSkeleton className="h-4 w-20" />
      <ShimmerSkeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

// Dashboard skeleton
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <ShimmerSkeleton className="h-8 w-48" />
        <ShimmerSkeleton className="h-4 w-32" />
      </div>
      
      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-3">
        <ShimmerSkeleton className="h-5 w-24" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <ShimmerSkeleton className="h-12 w-12 rounded-full mx-auto" />
              <ShimmerSkeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="space-y-3">
        <ShimmerSkeleton className="h-5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export {
  Skeleton,
  ShimmerSkeleton,
  BalanceSkeleton,
  CardSkeleton,
  TransactionSkeleton,
  QRCodeSkeleton,
  ButtonSkeleton,
  InputSkeleton,
  DashboardSkeleton,
}
