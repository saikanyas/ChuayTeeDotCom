'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface BarData {
  day: string
  expense: number
  income: number
}

export default function BarChartImpl({ data }: { data: BarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8E8E93' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E8E93' }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #FFE4ED', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
        />
        <Bar dataKey="expense" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="รายจ่าย" />
        <Bar dataKey="income" fill="#34C759" radius={[6, 6, 0, 0]} name="รายรับ" />
      </BarChart>
    </ResponsiveContainer>
  )
}
