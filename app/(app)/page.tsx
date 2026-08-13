'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TopHeader from '@/components/finance/top-header'
import BubbleCluster from '@/components/finance/bubble-cluster'
import MonthlySummaryCard from '@/components/finance/monthly-summary-card'
import GoalCard from '@/components/finance/goal-card'
import { useFinanceStore, Goal } from '@/store/finance'
import { createClient } from '@/lib/supabase/client'
import * as TransactionsDB from '@/lib/supabase/transactions'
import * as GoalsDB from '@/lib/supabase/goals'
import * as AccountsDB from '@/lib/supabase/accounts'
import { ChevronDown, Menu, Plus, Target, Sparkles, X, AlertCircle, Trash2 } from 'lucide-react'
import DynamicBarChart from '@/components/finance/charts/dynamic-bar-chart'
import DynamicPieChart from '@/components/finance/charts/dynamic-pie-chart'

import PWAInstallBanner from '@/components/pwa-install-banner'
import { useRouter } from 'next/navigation'
import { LUCIDE_CATEGORY_ICON_MAP } from '@/lib/utils'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useGoals } from '@/hooks/use-goals'

export default function DashboardPage() {
  const router = useRouter()
  const { transactions, setTransactions, accounts, setAccounts, goals, setGoals, addGoal, removeGoal, dailyTarget, setDailyTarget } = useFinanceStore()
  const [user, setUser] = useState<any>(null)
  const [activeHeaderTab, setActiveHeaderTab] = useState('ภาพรวม')
  const [displayType, setDisplayType] = useState<'expense' | 'income'>('expense')
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | '3month'>('month')
  
  // Add Goal Modal State
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalCurrent, setGoalCurrent] = useState('')
  const [goalError, setGoalError] = useState<string | null>(null)

  const supabase = createClient()

  const { transactions: swrTxs } = useTransactions(user?.id)
  const { accounts: swrAccs } = useAccounts(user?.id)
  const { goals: swrGoals } = useGoals(user?.id)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const savedTarget = localStorage.getItem(`daily_target_${u.id}`)
        setDailyTarget(savedTarget ? Number(savedTarget) : 0)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (swrTxs && swrTxs.length >= 0) setTransactions(swrTxs)
  }, [swrTxs, setTransactions])

  useEffect(() => {
    if (swrAccs && swrAccs.length >= 0) setAccounts(swrAccs)
  }, [swrAccs, setAccounts])

  useEffect(() => {
    if (swrGoals && swrGoals.length >= 0) setGoals(swrGoals)
  }, [swrGoals, setGoals])

  // Dynamic calculations from current transactions & accounts state
  const totalWalletsBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const netBalance = totalWalletsBalance
  const currentHeroAmount = displayType === 'expense' ? totalExpense : totalIncome

  // Category breakdown for bubble orbit
  const categorySummaries = transactions
    .filter(t => t.type === displayType)
    .reduce((acc: any[], t) => {
      const catName = (t.categoryName && t.categoryName !== 'ทั่วไป' && LUCIDE_CATEGORY_ICON_MAP[t.categoryName])
        ? t.categoryName
        : (t.description && LUCIDE_CATEGORY_ICON_MAP[t.description] ? t.description : (t.categoryName || t.description || 'ทั่วไป'))
      const existing = acc.find(c => c.name === catName)
      if (existing) {
        existing.amount += t.amount
      } else {
        acc.push({
          name: catName,
          icon: catName,
          amount: t.amount,
          color: t.categoryColor
        })
      }
      return acc
    }, [])

  // Daily spending map for calendar heatmap calculation
  const dailySpendingMap = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      const d = t.date || new Date().toISOString().split('T')[0]
      acc[d] = (acc[d] || 0) + Number(t.amount || 0)
      return acc
    }, {})

  // Requirement 1: REAL Graph Calculations from real transactions
  const daysOfWeek = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
  
  // Calculate real daily income & expense per day of week
  const barData = daysOfWeek.map((dayLabel, idx) => {
    // Map Monday=0 to Sunday=6
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

  // Calculate real expense by category pie chart data
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

  // Handle Add Goal — persists to Supabase
  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      setGoalError('กรุณากรอกชื่อเป้าหมายด้วยนะครับ ⚠️')
      return
    }
    const targetNum = parseFloat(goalTarget) || 0
    if (targetNum <= 0) {
      setGoalError('กรุณากรอกจำนวนเงินเป้าหมายให้ถูกต้องนะครับ ⚠️')
      return
    }

    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const created = await GoalsDB.createGoal(u.id, {
        title: goalTitle.trim(),
        description: goalDesc.trim() || 'เป้าหมายออมเงิน',
        target_amount: targetNum,
        current_amount: parseFloat(goalCurrent) || 0,
        color: '#FF3478',
      })
      addGoal(created)
    } catch (e) {
      console.error('createGoal failed:', e)
    }
    setGoalTitle('')
    setGoalDesc('')
    setGoalTarget('')
    setGoalCurrent('')
    setGoalError(null)
    setShowAddGoalModal(false)
  }

  return (
    <div className="min-h-screen bg-[#F9F8FA] pb-24 font-body">
      {/* Centered Top Header */}
      <TopHeader 
        userName={user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Yotsakon Saikanya'}
        avatarUrl={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.identities?.[0]?.identity_data?.avatar_url || user?.identities?.[0]?.identity_data?.picture}
        activeTab={activeHeaderTab}
        onTabChange={setActiveHeaderTab}
      />

      {/* Main Body Canvas */}
      <main className="px-4 pt-2 font-body">
        {/* Currency & Menu Row */}
        <div className="flex items-center justify-between py-2">
          <button className="flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 border border-gray-200/80 shadow-2xs font-body">
            THB <ChevronDown size={14} />
          </button>
          <button 
            onClick={() => router.push('/settings')} 
            className="w-8 h-8 rounded-full bg-white/80 border border-gray-200/80 flex items-center justify-center text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95 transition-all"
            title="ตั้งค่าและเมนู"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Animated Sub-View Switcher */}
        <AnimatePresence mode="wait">
          {activeHeaderTab === 'ภาพรวม' && (
            <motion.div
              key="overview-subview"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              {/* Hero Orbit Category Cluster */}
              <BubbleCluster 
                type={displayType}
                onTypeChange={setDisplayType}
                totalAmount={currentHeroAmount}
                dateTitle={`${displayType === 'expense' ? 'รายจ่าย' : 'รายรับ'} 8 สิงหาคม`}
                categories={categorySummaries}
              />

              {/* PWA Install Banner */}
              <div className="mt-4">
                <PWAInstallBanner />
              </div>

              {/* Monthly Summary & Full Month Calendar Heatmap Card */}
              <div className="mt-4">
                <MonthlySummaryCard 
                  monthName="สิงหาคม 2569"
                  dateRangeText="1-31 ส.ค. 69"
                  totalExpense={totalExpense}
                  totalIncome={totalIncome}
                  netBalance={netBalance}
                  dailyTarget={dailyTarget}
                  dailySpendingMap={dailySpendingMap}
                  onUpdateDailyTarget={(newVal) => {
                    setDailyTarget(newVal)
                    if (user?.id) {
                      localStorage.setItem(`daily_target_${user.id}`, newVal.toString())
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Requirement 2 & 3: Goals Tab (Dynamic Real User Goals + Add Goal Button + Quote Card) */}
          {activeHeaderTab === 'เป้าหมาย' && (
            <motion.div
              key="goals-subview"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="py-4 space-y-4 font-body"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold font-display text-gray-800 flex items-center gap-2">
                  <Target size={20} className="text-[var(--color-primary)]" /> เป้าหมายออมเงิน
                </h2>
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => {
                    setGoalError(null)
                    setShowAddGoalModal(true)
                  }}
                  className="text-xs font-bold px-3.5 py-2 rounded-full bg-[var(--color-primary)] text-white flex items-center gap-1 shadow-2xs active:scale-95 transition-transform font-body"
                >
                  <Plus size={15} strokeWidth={2.5} /> เพิ่มเป้าหมาย
                </motion.button>
              </div>

              {/* Dynamic User Goals List (Requirement 2: Sample goals removed) */}
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.map(g => (
                    <div key={g.id} className="relative group">
                      <GoalCard 
                        title={g.title} 
                        description={g.description} 
                        current={g.current} 
                        target={g.target} 
                      />
                      <button
                        onClick={async () => {
                          try {
                            await GoalsDB.deleteGoal(g.id)
                            removeGoal(g.id)
                          } catch (e) {
                            console.error('deleteGoal failed:', e)
                          }
                        }}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1 transition-colors"
                        title="ลบเป้าหมาย"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center text-gray-400 space-y-3 border border-pink-100 font-body shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 text-[var(--color-primary)] flex items-center justify-center mx-auto text-2xl shadow-2xs">
                    🎯
                  </div>
                  <p className="text-sm font-bold text-gray-700 font-body">ยังไม่มีเป้าหมายออมเงิน</p>
                  <p className="text-xs text-gray-400 font-body">
                    กดปุ่ม "+ เพิ่มเป้าหมาย" ด้านบนเพื่อเริ่มสร้างเป้าหมายเก็บเงินของคุณนะ
                  </p>
                </div>
              )}

              {/* Requirement 3: Cool Quote Card kept intact */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs text-center font-body">
                <Sparkles size={28} className="mx-auto text-amber-400 mb-2" />
                <p className="font-bold text-sm text-gray-800">วินัยการออมคือจุดเริ่มต้นของการรอดสิ้นเดือน</p>
                <p className="text-xs text-gray-500 mt-1">ตั้งเป้าหมายเล็กๆ แล้วค่อยๆ สะสมไปทีละวันนะ 🎯</p>
              </div>
            </motion.div>
          )}

          {/* Requirement 1: Reports Tab showing REAL data from transactions */}
          {activeHeaderTab === 'รายงาน' && (
            <motion.div
              key="reports-subview"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="py-4 space-y-4 font-body"
            >
              {/* Period Filter Tabs */}
              <div className="flex gap-2 mb-2 bg-white p-1 rounded-full border border-gray-200/80 shadow-2xs w-fit mx-auto font-body">
                {[
                  { id: 'week', label: 'สัปดาห์นี้' },
                  { id: 'month', label: 'เดือนนี้' },
                  { id: '3month', label: '3 เดือน' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setReportPeriod(tab.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all font-body ${
                      reportPeriod === tab.id
                        ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Weekly Bar Chart Card (REAL DATA) */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs font-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-gray-800">แนวโน้มรายรับ - รายจ่ายจริง</h3>
                  <span className="text-[10px] text-gray-400 font-bold bg-pink-50 px-2 py-0.5 rounded-full text-[var(--color-primary)]">
                    ข้อมูลจริงตามรายรับ-รายจ่าย
                  </span>
                </div>
                <DynamicBarChart data={barData.map(b => ({ day: b.name, expense: b.expense, income: b.income }))} />
              </div>

              {/* Category Pie Chart Card (REAL DATA) */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs font-body">
                <h3 className="font-bold text-sm text-gray-800 mb-4">สัดส่วนรายจ่ายตามหมวดหมู่จริง</h3>
                {pieData.length > 0 ? (
                  <>
                    <DynamicPieChart data={pieData} />

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 font-body">
                      {pieData.map(item => (
                        <div key={item.name} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-gray-600 font-body truncate">{item.name}</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Requirement 2: Add Goal Modal */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div 
            onClick={() => setShowAddGoalModal(false)}
            className="fixed inset-0 z-[130] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer font-body"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-base text-gray-800 font-body flex items-center gap-2">
                  <Target size={18} className="text-[var(--color-primary)]" /> เพิ่มเป้าหมายออมเงินใหม่
                </h3>
                <button onClick={() => setShowAddGoalModal(false)} className="text-gray-400 p-1 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {goalError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-xs font-bold text-red-600 animate-shake font-body">
                  <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                  <span>{goalError}</span>
                </div>
              )}

              <div className="space-y-3 font-body">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ชื่อเป้าหมาย <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={goalTitle}
                    onChange={(e) => {
                      setGoalTitle(e.target.value)
                      if (e.target.value.trim()) setGoalError(null)
                    }}
                    placeholder="เช่น ซื้อคอมพิวเตอร์ใหม่, ค่าหอพัก"
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">รายละเอียดเพิ่มเติม</label>
                  <input 
                    type="text" 
                    value={goalDesc}
                    onChange={(e) => setGoalDesc(e.target.value)}
                    placeholder="เช่น เพื่อการศึกษา, ต้นเดือนหน้า"
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-medium text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ยอดเงินเป้าหมาย (บาท) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="เช่น 15000"
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-base font-bold font-mono text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">เงินสะสมเริ่มต้น (บาท)</label>
                  <input 
                    type="number" 
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-base font-bold font-mono text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1 font-body">
                <button
                  onClick={() => setShowAddGoalModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 font-bold text-xs text-gray-600 active:bg-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveGoal}
                  className="flex-1 py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                  บันทึกเป้าหมาย
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
