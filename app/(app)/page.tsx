'use client'

import { useEffect, useState } from 'react'
import BalanceHeader from '@/components/finance/balance-header'
import GoalCard from '@/components/finance/goal-card'
import TransactionItem from '@/components/finance/transaction-item'
import { useFinanceStore } from '@/store/finance'
import { createClient } from '@/lib/supabase/client'
import { formatThaiDate } from '@/lib/utils'

export default function DashboardPage() {
  const { transactions, setTransactions } = useFinanceStore()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Mock data for demo, replace with real fetch later
      setTransactions([
        { id: '1', categoryName: 'อาหาร', categoryIcon: '🍜', categoryColor: '#FF9500', description: 'ข้าวมันไก่', time: '12:30', source: 'manual', amount: 50, type: 'expense' },
        { id: '2', categoryName: 'ค่าเดินทาง', categoryIcon: '🚌', categoryColor: '#5AC8FA', description: 'BTS', time: '08:45', source: 'slip_scan', amount: 44, type: 'expense' },
      ])
    }
    loadData()
  }, [])

  return (
    <div className="min-h-full pb-8">
      <BalanceHeader 
        displayName={user?.user_metadata?.display_name || 'ผู้ใช้'} 
        totalBalance={4500} 
        totalIncome={6000} 
        totalExpense={1500} 
        month={formatThaiDate(new Date())} 
      />
      
      <div className="px-4 mt-6 mb-8">
        <GoalCard 
          title="เก็บเงินซื้อรองเท้า" 
          description="เป้าหมายเดือนนี้" 
          current={1200} 
          target={3500} 
        />
      </div>

      <div className="px-4">
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>วันนี้</h2>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: 'var(--color-border)' }}>
          {transactions.length > 0 ? (
            transactions.map(t => (
              <TransactionItem key={t.id} {...t as any} />
            ))
          ) : (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              ยังไม่มีรายการวันนี้ กดปุ่ม + เพื่อเริ่มบันทึก 💰
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
