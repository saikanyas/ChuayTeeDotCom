'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Bell, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-full p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 mt-4 text-gray-800">ตั้งค่า</h1>
      
      <div className="bg-white rounded-2xl p-4 flex items-center mb-6 border">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white text-2xl font-bold flex items-center justify-center mr-4">
          {user?.user_metadata?.display_name?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="font-bold text-lg">{user?.user_metadata?.display_name || 'ผู้ใช้'}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border mb-6 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center"><Bell size={20} className="mr-3 text-gray-600" /> แจ้งเตือนบันทึกรายจ่าย</div>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-gray-600 ml-8 text-sm">เวลาแจ้งเตือน</span>
          <span className="font-bold">20:00 <ChevronRight size={16} className="inline" /></span>
        </div>
      </div>

      <button onClick={signOut} className="w-full bg-white border border-red-200 text-red-500 rounded-2xl p-4 font-bold flex justify-center items-center">
        <LogOut size={20} className="mr-2" /> ออกจากระบบ
      </button>

      <p className="text-center text-xs text-gray-400 mt-8">ช่วยที.com v1.0.0</p>
    </div>
  )
}
