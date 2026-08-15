'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFinanceStore } from '@/store/finance'
import { LogOut, Bell, ChevronRight, Target } from 'lucide-react'
import PWAInstallBanner from '@/components/pwa-install-banner'

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
    // Clear client-side cache
    useFinanceStore.getState().setAccounts([])
    useFinanceStore.getState().setTransactions([])
    useFinanceStore.getState().setGoals([])
    window.location.href = '/login'
  }

  const handleTargetChange = (val: string) => {
    setTargetInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      setDailyTarget(num)
      if (user?.id) {
        localStorage.setItem(`daily_target_${user.id}`, num.toString())
      }
    }
  }

  const isTargetZero = dailyTarget === 0 || !targetInput || targetInput === '0'

  const avatarUrl = user?.user_metadata?.avatar_url || 
                    user?.user_metadata?.picture || 
                    user?.identities?.[0]?.identity_data?.avatar_url || 
                    user?.identities?.[0]?.identity_data?.picture

  const displayName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.user_metadata?.display_name || 
                      user?.email?.split('@')[0] || 
                      'ผู้ใช้'

  return (
    <div className="min-h-screen p-4 bg-[#F9F8FA] pb-28 font-body">
      <h1 className="text-xl font-display font-bold mb-6 mt-2 text-gray-800">ตั้งค่าและเมนู</h1>
      
      {/* User profile card (Clickable to edit profile) */}
      <div 
        onClick={() => router.push('/profile')}
        className="bg-white rounded-2xl p-4 flex items-center justify-between mb-6 border border-pink-100 shadow-2xs font-body cursor-pointer hover:border-pink-300 active:scale-98 transition-all"
      >
        <div className="flex items-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white text-xl font-bold flex items-center justify-center mr-4 shadow-xs shrink-0 overflow-hidden border border-pink-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-800 font-body">{displayName}</h2>
            <p className="text-xs text-gray-500 font-body">{user?.email || 'บัญชีเริ่มต้น'}</p>
            <span className="text-[10px] font-bold text-[var(--color-primary)] mt-0.5 block">
              แตะเพื่อตั้งค่าโปรไฟล์ ➔
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400 shrink-0" />
      </div>

      {/* Configurable Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden shadow-2xs font-body">
        {/* Daily Target Setting (Target Heatmap Limit) with Alternating Pulsing Notification Highlight */}
        <div className={`p-4 border-b border-gray-100 flex justify-between items-center transition-all font-body ${
          isTargetZero 
            ? 'animate-pulse bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl shadow-lg border-2 border-pink-300 ring-4 ring-pink-400/40 my-1' 
            : ''
        }`}>
          <div className="flex items-center gap-3 font-body">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isTargetZero ? 'bg-white text-pink-600' : 'bg-pink-50 text-[var(--color-primary)]'
            }`}>
              <Target size={18} />
            </div>
            <div>
              <p className="font-bold text-sm flex items-center gap-1.5 font-body">
                เป้าหมายเงินที่ใช้รายวัน
                {isTargetZero && (
                  <span className="text-[10px] bg-white text-pink-700 px-2 py-0.5 rounded-full font-bold shadow-2xs animate-bounce">
                    👈 ตั้งค่าตรงนี้นะ!
                  </span>
                )}
              </p>
              <p className={`text-[11px] font-body ${isTargetZero ? 'text-pink-100 font-medium' : 'text-gray-400'}`}>
                ใช้คำนวณ Heatmap ในปฏิทิน
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border font-body ${
            isTargetZero ? 'bg-white border-pink-200 text-gray-900 shadow-md' : 'bg-gray-50 border-gray-200'
          }`}>
            <span className="text-xs font-bold text-gray-400">฿</span>
            <input 
              type="number" 
              value={targetInput} 
              onChange={(e) => handleTargetChange(e.target.value)} 
              placeholder="0"
              className="w-16 bg-transparent text-sm font-bold font-mono text-gray-800 outline-none text-right font-body"
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

      {/* PWA Install Banner */}
      <div className="mb-6">
        <PWAInstallBanner />
      </div>

      <button onClick={signOut} className="w-full bg-white border border-red-200 text-red-500 rounded-2xl p-4 font-bold flex justify-center items-center text-sm shadow-2xs active:scale-98 transition-transform">
        <LogOut size={18} className="mr-2" /> ออกจากระบบ
      </button>

      <p className="text-center text-xs text-gray-400 mt-8">ช่วยที.com v1.0.0 made with ૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა ❤️ </p>
      
    </div>
  )
}
