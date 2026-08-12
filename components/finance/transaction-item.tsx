'use client'

import { formatThaiCurrency, getLucideCategoryIcon, formatFullThaiDateTime } from '@/lib/utils'
import { Camera } from 'lucide-react'

interface Props {
  id: string
  categoryName: string
  categoryIcon?: string
  categoryColor?: string
  description: string
  time: string
  date?: string
  source: 'manual' | 'slip_scan'
  amount: number
  type: 'income' | 'expense'
  note?: string
  accountName?: string
  onClick?: () => void
}

export default function TransactionItem({ 
  categoryName, 
  description, 
  time, 
  date,
  source, 
  amount, 
  type, 
  note, 
  onClick 
}: Props) {
  const isIncome = type === 'income'
  const IconComp = getLucideCategoryIcon(categoryName)
  const displayDateTime = formatFullThaiDateTime(date, time)

  return (
    <div 
      onClick={onClick}
      className="flex items-center p-4 bg-white border-b border-gray-100 last:border-0 w-full cursor-pointer hover:bg-pink-50/30 transition-colors font-body active:bg-pink-50/60"
    >
      {/* Category Icon matching Image 2 style (Lucide Icon in pink-tinted rounded square) */}
      <div 
        className="w-11 h-11 rounded-2xl flex items-center justify-center mr-3 shrink-0 shadow-2xs bg-pink-50/80 border border-pink-100/60 text-[var(--color-primary)]"
      >
        <IconComp size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-gray-800 font-body">{description || categoryName}</p>
        <div className="flex items-center text-xs mt-0.5 space-x-2 text-gray-400 font-body">
          <span>{displayDateTime}</span>
          {source === 'slip_scan' && (
            <span className="flex items-center bg-pink-50 text-[var(--color-primary)] px-1.5 py-0.5 rounded-md text-[10px] font-bold">
              <Camera size={10} className="mr-1" /> Slip Scan
            </span>
          )}
          {note && <span className="truncate max-w-[100px] bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{note}</span>}
        </div>
      </div>
      
      <div className={`text-right font-bold text-sm font-body ${isIncome ? 'text-green-600' : 'text-gray-800'}`}>
        {isIncome ? '+' : '-'}{formatThaiCurrency(amount)}
      </div>
    </div>
  )
}
