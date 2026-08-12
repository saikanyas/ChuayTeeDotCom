'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useFinanceStore } from '@/store/finance'

export default function AddPage() {
  const router = useRouter()
  const { addTransaction } = useFinanceStore()
  const [type, setType] = useState<'income'|'expense'>('expense')
  const [amount, setAmount] = useState('0')
  const [desc, setDesc] = useState('')

  const handleKey = (k: string) => {
    if (k === 'back') setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
    else setAmount(prev => prev === '0' ? k : prev + k)
  }

  const save = () => {
    addTransaction({
      id: Math.random().toString(),
      categoryName: 'อื่นๆ',
      categoryIcon: '📝',
      categoryColor: '#8E8E93',
      description: desc || 'ไม่ได้ระบุ',
      time: '12:00',
      source: 'manual',
      amount: parseFloat(amount),
      type
    })
    router.back()
  }

  return (
    <div className="min-h-full flex flex-col bg-white">
      <div className="p-4 flex justify-center border-b">
        <div className="flex bg-gray-100 rounded-full p-1 w-48">
          <button className={cn("flex-1 py-1 text-sm font-bold rounded-full", type === 'expense' ? "bg-white text-red-500 shadow-sm" : "text-gray-500")} onClick={() => setType('expense')}>รายจ่าย</button>
          <button className={cn("flex-1 py-1 text-sm font-bold rounded-full", type === 'income' ? "bg-white text-green-500 shadow-sm" : "text-gray-500")} onClick={() => setType('income')}>รายรับ</button>
        </div>
      </div>
      
      <div className="p-8 text-center flex-1 flex flex-col justify-center">
        <h2 className="text-5xl font-mono-amount font-bold mb-4" style={{ color: type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)' }}>
          ฿{amount}
        </h2>
        <input type="text" placeholder="ระบุรายละเอียด (ถ้ามี)" className="text-center bg-gray-50 rounded-lg py-3 px-4 w-full" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div className="bg-gray-50 p-6 pb-safe rounded-t-3xl shadow-lg">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['1','2','3','4','5','6','7','8','9','.','0','back'].map(k => (
            <button key={k} onClick={() => handleKey(k)} className="bg-white text-xl font-bold py-4 rounded-xl shadow-sm active:scale-95 transition-transform text-gray-800">
              {k === 'back' ? '⌫' : k}
            </button>
          ))}
        </div>
        <button className="btn-primary w-full text-lg py-4" onClick={save}>บันทึกรายการ</button>
      </div>
    </div>
  )
}
