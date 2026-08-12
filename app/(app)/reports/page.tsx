'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/finance'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default function ReportsPage() {
  const { transactions } = useFinanceStore()
  const [period, setPeriod] = useState<'week' | 'month' | '3month'>('month')

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  // Real Chart Data: Daily income & expense per day of week
  const daysOfWeek = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
  
  const barData = daysOfWeek.map((dayLabel, idx) => {
    const dayTransactions = transactions.filter(t => {
      if (!t.date) return false
      const d = new Date(t.date)
      const dayIdx = (d.getDay() + 6) % 7 // Monday = 0
      return dayIdx === idx
    })

    const expSum = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    
    const incSum = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)

    return {
      name: dayLabel,
      expense: expSum,
      income: incSum
    }
  })

  // Real Pie chart data by category
  const pieDataMap: Record<string, { value: number; color: string }> = {}
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = t.categoryName || 'อื่นๆ'
      if (!pieDataMap[cat]) {
        pieDataMap[cat] = { value: 0, color: t.categoryColor || '#FF3478' }
      }
      pieDataMap[cat].value += t.amount
    })

  const pieData = Object.entries(pieDataMap).map(([name, data]) => ({
    name,
    value: data.value,
    color: data.color
  }))

  return (
    <div className="min-h-screen bg-[#F9F8FA] p-4 pb-28 font-body">
      <h1 className="text-xl font-display font-bold text-gray-800 mb-4 mt-2">รายงานสรุปการเงินจริง</h1>

      {/* Period Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-full border border-gray-200/80 shadow-2xs w-fit">
        {[
          { id: 'week', label: 'สัปดาห์นี้' },
          { id: 'month', label: 'เดือนนี้' },
          { id: '3month', label: '3 เดือน' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              period === tab.id
                ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <ArrowDownRight size={18} />
            <span className="text-xs font-medium text-gray-500">รายจ่ายรวม</span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--color-expense)]">
            ฿{totalExpense.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <ArrowUpRight size={18} />
            <span className="text-xs font-medium text-gray-500">รายรับรวม</span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--color-income)]">
            ฿{totalIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Weekly Bar Chart Card */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs mb-6">
        <h3 className="font-bold text-sm text-gray-800 mb-4">แนวโน้มรายรับ - รายจ่ายจริง</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#8E8E93" fontSize={11} tickLine={false} />
              <YAxis stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, '']} />
              <Bar dataKey="expense" fill="#FF3D30" radius={[4, 4, 0, 0]} name="รายจ่าย" />
              <Bar dataKey="income" fill="#34C759" radius={[4, 4, 0, 0]} name="รายรับ" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Pie Chart Card */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <h3 className="font-bold text-sm text-gray-800 mb-4">สัดส่วนรายจ่ายตามหมวดหมู่จริง</h3>
        {pieData.length > 0 ? (
          <>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`฿${Number(val).toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 font-body">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 truncate font-body">{item.name}</span>
                  <span className="font-bold font-mono ml-auto">฿{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-xs text-gray-400 font-body space-y-1">
            <p>ยังไม่มีบันทึกรายการรายจ่าย 📝</p>
            <p className="text-[10px]">บันทึกรายจ่ายแรกของคุณเพื่อดูสัดส่วนหมวดหมู่ที่นี่</p>
          </div>
        )}
      </div>
    </div>
  )
}
