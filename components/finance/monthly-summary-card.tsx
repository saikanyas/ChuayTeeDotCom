'use client'

import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'

interface MonthlySummaryCardProps {
  monthName: string
  dateRangeText: string
  totalExpense: number
  totalIncome: number
  netBalance: number
  dailyTarget?: number
  dailySpendingMap?: Record<string, number>
}

export default function MonthlySummaryCard({
  monthName = 'สิงหาคม 2569',
  dateRangeText = '1-31 ส.ค. 69',
  totalExpense = 0,
  totalIncome = 0,
  netBalance = 0,
  dailyTarget = 300,
  dailySpendingMap = {},
}: MonthlySummaryCardProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 12)) // Aug 2026

  // Generate full 35-42 days calendar matrix for selected month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonthLastDay = new Date(year, month, 0).getDate()

  const calendarDays: Array<{
    dateNumber: number
    fullDateStr: string
    isCurrentMonth: boolean
    spending: number
  }> = []

  // 1. Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevMonthDate = new Date(year, month - 1, d)
    const dateStr = prevMonthDate.toISOString().split('T')[0]
    calendarDays.push({
      dateNumber: d,
      fullDateStr: dateStr,
      isCurrentMonth: false,
      spending: dailySpendingMap[dateStr] || 0,
    })
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d)
    // format as YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push({
      dateNumber: d,
      fullDateStr: dateStr,
      isCurrentMonth: true,
      spending: dailySpendingMap[dateStr] || 0,
    })
  }

  // 3. Next month leading days to complete grid (multiples of 7)
  const remainingCells = (7 - (calendarDays.length % 7)) % 7
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d)
    const dateStr = nextMonthDate.toISOString().split('T')[0]
    calendarDays.push({
      dateNumber: d,
      fullDateStr: dateStr,
      isCurrentMonth: false,
      spending: dailySpendingMap[dateStr] || 0,
    })
  }

  const weekHeaders = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']

  // Helper for Heatmap background style based on dailyTarget
  const getHeatmapStyle = (spending: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return { opacity: 0.35 }
    if (spending === 0) return { backgroundColor: '#FFFFFF', color: '#4B5563' }

    // Ratio of spending vs daily target
    const ratio = Math.min(spending / Math.max(dailyTarget, 1), 1.5)

    if (ratio < 0.5) {
      return { backgroundColor: '#FFF0F5', color: '#991B1B' } // Soft pink
    } else if (ratio <= 1.0) {
      return { backgroundColor: '#FF6B9D', color: '#FFFFFF' } // Medium pink
    } else {
      return { backgroundColor: '#FF3478', color: '#FFFFFF', fontWeight: 'bold' } // Intense pink (over target)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100/80 mb-24">
      {/* Date filter row */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 cursor-pointer">
          <span className="font-display font-bold text-base text-gray-800">{monthName}</span>
          <ChevronDown size={18} className="text-gray-500" />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">{dateRangeText}</span>
          <button className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:bg-gray-100">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* 3 Summary Columns */}
      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">รายจ่ายรวม</p>
          <p className="text-sm font-bold font-mono text-[var(--color-expense)]">
            {totalExpense.toLocaleString()} <span className="text-[11px] font-normal text-gray-400">บาท</span>
          </p>
        </div>

        <div className="border-x border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">รายรับรวม</p>
          <p className="text-sm font-bold font-mono text-[var(--color-income)]">
            {totalIncome.toLocaleString()} <span className="text-[11px] font-normal text-gray-400">บาท</span>
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">ยอดสุทธิ</p>
          <p className="text-sm font-bold font-mono text-gray-800">
            {netBalance.toLocaleString()} <span className="text-[11px] font-normal text-gray-400">บาท</span>
          </p>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2 px-1">
        <span>เป้าหมายรายวัน: ฿{dailyTarget}</span>
        <div className="flex items-center gap-1">
          <span>น้อย</span>
          <span className="w-3 h-3 rounded bg-[#FFF0F5] border" />
          <span className="w-3 h-3 rounded bg-[#FF6B9D]" />
          <span className="w-3 h-3 rounded bg-[#FF3478]" />
          <span>มาก</span>
        </div>
      </div>

      {/* Full Month Calendar View Grid with Heatmap */}
      <div className="bg-[#FFF5F8] rounded-2xl p-3 border border-pink-100/60">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 text-center gap-1 mb-2">
          {weekHeaders.map((dh) => (
            <span key={dh} className="text-[11px] font-semibold text-gray-500">
              {dh}
            </span>
          ))}
        </div>

        {/* Full Month Calendar Matrix */}
        <div className="grid grid-cols-7 text-center gap-1.5">
          {calendarDays.map((cell, idx) => {
            const style = getHeatmapStyle(cell.spending, cell.isCurrentMonth)
            return (
              <motion.div
                key={cell.fullDateStr + idx}
                whileTap={{ scale: 0.9 }}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium shadow-2xs transition-all relative border border-gray-100/50 ${
                  !cell.isCurrentMonth ? 'opacity-30' : ''
                }`}
                style={style}
              >
                <span>{cell.dateNumber}</span>
                {cell.spending > 0 && cell.isCurrentMonth && (
                  <span className="text-[8px] font-mono leading-none opacity-90 mt-0.5">
                    ฿{cell.spending}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
