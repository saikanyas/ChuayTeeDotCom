'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFinanceStore } from '@/store/finance'
import { LogOut, Bell, ChevronRight, Target } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const { dailyTarget, setDailyTarget } = useFinanceStore()
  const [targetInput, setTargetInput] = useState(dailyTarget.toString())

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleTargetChange = (val: string) => {
    setTargetInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) {
      setDailyTarget(num)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-[#F9F8FA] pb-28">
      <h1 className="text-xl font-display font-bold mb-6 mt-2 text-gray-800">ตั้งค่าและเมนู</h1>
      
      {/* User profile card */}
      <div className="bg-white rounded-2xl p-4 flex items-center mb-6 border border-gray-100 shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center mr-4 shadow-xs">
          {user?.user_metadata?.display_name?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="font-bold text-base text-gray-800">{user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'ผู้ใช้'}</h2>
          <p className="text-xs text-gray-500">{user?.email || 'บัญชีเริ่มต้น'}</p>
        </div>
      </div>

      {/* Configurable Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden shadow-2xs">
        {/* Daily Target Setting (Target Heatmap Limit) */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-[var(--color-primary)]">
              <Target size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800">เป้าหมายเงินที่ใช้รายวัน</p>
              <p className="text-[11px] text-gray-400">ใช้คำนวณ Heatmap ในปฏิทิน</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-400">฿</span>
            <input 
              type="number" 
              value={targetInput} 
              onChange={(e) => handleTargetChange(e.target.value)} 
              className="w-16 bg-transparent text-sm font-bold font-mono text-gray-800 outline-none text-right"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Bell size={18} />
            </div>
            <span className="font-bold text-sm text-gray-800">แจ้งเตือนบันทึกรายจ่าย</span>
          </div>
          <input type="checkbox" className="toggle accent-[var(--color-primary)]" defaultChecked />
        </div>

        <div className="p-4 flex justify-between items-center">
          <span className="text-gray-500 ml-12 text-xs">เวลาแจ้งเตือนประจำวัน</span>
          <span className="font-bold text-xs text-gray-700">20:00 <ChevronRight size={14} className="inline ml-1" /></span>
        </div>
      </div>

      <button onClick={signOut} className="w-full bg-white border border-red-200 text-red-500 rounded-2xl p-4 font-bold flex justify-center items-center text-sm shadow-2xs active:scale-98 transition-transform">
        <LogOut size={18} className="mr-2" /> ออกจากระบบ
      </button>

      <p className="text-center text-xs text-gray-400 mt-8">ช่วยที.com v1.0.0</p>
    </div>
  )
}
