'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from './chart-skeleton'

const BarChartImpl = dynamic(() => import('./bar-chart-impl'), {
  ssr: false,
  loading: () => <ChartSkeleton height={200} />,
})

export default function DynamicBarChart({ data }: { data: any[] }) {
  return <BarChartImpl data={data} />
}
