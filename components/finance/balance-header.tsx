import { formatThaiCurrency } from '@/lib/utils'

interface Props {
  displayName: string
  totalBalance: number
  totalIncome: number
  totalExpense: number
  month: string
}

export default function BalanceHeader({ displayName, totalBalance, totalIncome, totalExpense, month }: Props) {
  return (
    <div className="pt-8 pb-6 px-6 bg-white relative" style={{ backgroundImage: 'linear-gradient(to bottom, var(--color-surface-tint), transparent)' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-second)' }}>สวัสดี, {displayName} 👋</p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{month}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
          {displayName.charAt(0)}
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-second)' }}>ยอดคงเหลือรวม</p>
        <h1 className="text-4xl font-mono-amount font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatThaiCurrency(totalBalance)}
        </h1>
      </div>

      <div className="flex justify-between space-x-4">
        <div className="flex-1 bg-gray-50 rounded-xl p-3 flex flex-col items-center">
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>รายรับ</p>
          <p className="font-bold text-sm" style={{ color: 'var(--color-income)' }}>+{formatThaiCurrency(totalIncome)}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-3 flex flex-col items-center">
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>รายจ่าย</p>
          <p className="font-bold text-sm" style={{ color: 'var(--color-expense)' }}>-{formatThaiCurrency(totalExpense)}</p>
        </div>
      </div>
    </div>
  )
}
