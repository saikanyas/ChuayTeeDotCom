'use client'

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div 
      style={{ height: `${height}px` }} 
      className="w-full bg-pink-50/40 rounded-2xl border border-pink-100/60 animate-pulse flex items-center justify-center text-xs text-pink-300 font-bold"
    >
      กำลังโหลดกราฟ...
    </div>
  )
}
