'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from './chart-skeleton'

const PieChartImpl = dynamic(() => import('./pie-chart-impl'), {
  ssr: false,
  loading: () => <ChartSkeleton height={200} />,
})

export default function DynamicPieChart({ data }: { data: any[] }) {
  return <PieChartImpl data={data} />
}
