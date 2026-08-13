'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PieData {
  name: string
  value: number
  color: string
}

export default function PieChartImpl({ data }: { data: PieData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-xs text-gray-400 font-bold">
        ยังไม่มีข้อมูลกราฟวงกลม
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #FFE4ED', fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
