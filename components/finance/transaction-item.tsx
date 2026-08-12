import { formatThaiCurrency } from '@/lib/utils'
import { Camera } from 'lucide-react'

interface Props {
  id: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  description: string
  time: string
  source: 'manual' | 'slip_scan'
  amount: number
  type: 'income' | 'expense'
  note?: string
}

export default function TransactionItem({ categoryName, categoryIcon, categoryColor, description, time, source, amount, type, note }: Props) {
  const isIncome = type === 'income'
  
  return (
    <div className="flex items-center p-4 bg-white border-b border-gray-100 last:border-0 w-full">
      <div className="category-icon w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4" style={{ backgroundColor: `${categoryColor}20` }}>
        {categoryIcon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{description || categoryName}</p>
        <div className="flex items-center text-xs mt-1 space-x-2" style={{ color: 'var(--color-text-tertiary)' }}>
          <span>{time}</span>
          {source === 'slip_scan' && (
            <span className="flex items-center bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
              <Camera size={10} className="mr-1" /> Slip Scan
            </span>
          )}
          {note && <span className="truncate max-w-[100px] bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{note}</span>}
        </div>
      </div>
      
      <div className={`text-right font-medium ${isIncome ? 'amount-income' : 'amount-expense'}`} style={{ color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}>
        {isIncome ? '+' : '-'}{formatThaiCurrency(amount)}
      </div>
    </div>
  )
}
