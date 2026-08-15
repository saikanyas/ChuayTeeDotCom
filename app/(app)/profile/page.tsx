'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useFinanceStore } from '@/store/finance'
import { 
  ArrowLeft, User, Mail, DollarSign, Globe, Calendar, 
  Check, Loader2, ShieldCheck, LogOut, Save
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        setUser(u)
        const name = u.user_metadata?.full_name || 
                     u.user_metadata?.name || 
                     u.user_metadata?.display_name || 
                     u.email?.split('@')[0] || 
                     ''
        setDisplayName(name)
      }
    }
    loadUser()
  }, [])

  const avatarUrl = user?.user_metadata?.avatar_url || 
                    user?.user_metadata?.picture || 
                    user?.identities?.[0]?.identity_data?.avatar_url || 
                    user?.identities?.[0]?.identity_data?.picture

  const email = user?.email || 'ไม่มีอีเมล'
  const isGoogleProvider = user?.app_metadata?.provider === 'google' || 
                          user?.identities?.some((i: any) => i.provider === 'google')

  const createdDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok'
      })
    : 'ไม่ทราบวันที่'

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMessage('กรุณากรอกชื่อที่ต้องการแสดงนะครับ ⚠️')
      return
    }
    setErrorMessage(null)
    setIsSaving(true)

    try {
      // 1. Update Supabase Auth user metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          display_name: displayName.trim(),
        }
      })
      if (authErr) throw authErr

      // 2. Upsert Supabase profiles table row
      if (user?.id) {
        await (supabase.from('profiles') as any).upsert({
          id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl || null,
          default_currency: 'THB',
        })
      }

      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (err: any) {
      console.error('Update profile failed:', err)
      setErrorMessage(err.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    useFinanceStore.getState().setAccounts([])
    useFinanceStore.getState().setTransactions([])
    useFinanceStore.getState().setGoals([])
    window.location.href = '/login'
  }

  return (
    <div className="bg-[#F9F8FA] p-4 pb-4 font-body text-gray-800">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-2xs active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-display font-bold text-gray-800">ตั้งค่าโปรไฟล์</h1>

        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-green-50 border border-green-200 rounded-2xl p-3.5 flex items-center gap-2 text-xs font-bold text-green-700 shadow-2xs font-body"
          >
            <Check size={16} className="text-green-600 shrink-0" />
            <span>บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้วครับ ✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs font-bold text-red-600 shadow-2xs font-body">
          {errorMessage}
        </div>
      )}

      {/* Profile Avatar Hero Card */}
      <div className="bg-white rounded-3xl p-6 text-center shadow-xs border border-pink-100/60 mb-5 relative overflow-hidden">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-pink-400 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-3 shadow-md overflow-hidden border-4 border-white relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span>{displayName.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>

        <h2 className="font-bold text-lg text-gray-800 font-body">{displayName || 'ผู้ใช้งาน'}</h2>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1 font-body">
          {email}
          {isGoogleProvider && (
            <span className="inline-flex items-center text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-bold border border-blue-100">
              Google Verified
            </span>
          )}
        </p>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-pink-100/60 space-y-4 mb-6">
        <h3 className="font-bold text-sm text-gray-700 border-b pb-2 font-body">ข้อมูลส่วนตัว</h3>

        {/* 1. Display Name Input */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5 font-body">
            <User size={14} className="text-[var(--color-primary)]" /> ชื่อที่แสดงในแอป
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="กรอกชื่อของคุณ"
            className="w-full bg-pink-50/40 border border-pink-200/80 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-[var(--color-primary)] transition-all font-body"
          />
        </div>

        {/* 2. Email Display (Read-Only) */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5 font-body">
            <Mail size={14} className="text-gray-400" /> อีเมลผู้ใช้งาน (ไม่สามารถแก้ไขได้)
          </label>
          <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm font-bold text-gray-500 flex items-center justify-between font-body">
            <span className="truncate">{email}</span>
            <ShieldCheck size={16} className="text-green-500 shrink-0 ml-2" />
          </div>
        </div>

        {/* 3. Currency & Language Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5 font-body">
              <DollarSign size={14} className="text-emerald-500" /> สกุลเงิน
            </label>
            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-xs font-bold text-gray-700 font-body">
              THB (฿ บาท)
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5 font-body">
              <Globe size={14} className="text-blue-500" /> ภาษาหลัก
            </label>
            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-xs font-bold text-gray-700 font-body">
              ไทย 🇹🇭
            </div>
          </div>
        </div>

        {/* 4. Registration Date Info */}
        <div className="pt-1">
          <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1.5 font-body">
            <Calendar size={14} className="text-purple-500" /> วันที่เข้าใช้งานสมาชิก
          </label>
          <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-xs font-bold text-gray-700 font-body">
            {createdDate}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md active:bg-pink-600 transition-all flex items-center justify-center gap-2 mb-4 font-body"
      >
        {isSaving ? (
          <>
            <Loader2 size={18} className="animate-spin" /> กำลังบันทึกข้อมูล...
          </>
        ) : (
          <>
            <Save size={18} /> บันทึกการเปลี่ยนแปลง
          </>
        )}
      </motion.button>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-white border border-red-200 text-red-500 rounded-2xl p-3.5 font-bold flex justify-center items-center text-xs shadow-2xs active:scale-98 transition-transform font-body"
      >
        <LogOut size={16} className="mr-1.5" /> ออกจากระบบ
      </button>
    </div>
  )
}
