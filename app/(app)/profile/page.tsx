'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useFinanceStore } from '@/store/finance'
import { uploadUserAvatar, updateProfileDisplayName, getProfile } from '@/lib/supabase/profiles'
import { compressAvatarImage } from '@/lib/utils'
import { 
  ArrowLeft, User, Mail, DollarSign, Globe, Calendar, 
  Check, Loader2, ShieldCheck, LogOut, Save, Camera, AlertCircle
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้วครับ ✨')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserAndProfile() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        setUser(u)
        
        // 1. Check profiles table first for custom avatar, fallback to Google metadata
        const profile = await getProfile(u.id)
        const name = profile?.display_name || 
                     u.user_metadata?.full_name || 
                     u.user_metadata?.name || 
                     u.user_metadata?.display_name || 
                     u.email?.split('@')[0] || 
                     ''
        setDisplayName(name)

        const initialAvatar = profile?.avatar_url || 
                              u.user_metadata?.avatar_url || 
                              u.user_metadata?.picture || 
                              u.identities?.[0]?.identity_data?.avatar_url || 
                              u.identities?.[0]?.identity_data?.picture || 
                              null
        setAvatarUrl(initialAvatar)
      }
    }
    loadUserAndProfile()
  }, [])

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

  // Handle Avatar Image File Upload with Fallback Protection
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]

    // Requirement: File type check
    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ (JPEG, PNG, WebP) ⚠️')
      if (e.target) e.target.value = ''
      return
    }

    // Size limit check (max 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ขนาดไฟล์รูปภาพเกิน 5MB กรุณาเลือกรูปขนาดเล็กลงนะครับ ⚠️')
      if (e.target) e.target.value = ''
      return
    }

    if (!user?.id) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อนเปลี่ยนรูปโปรไฟล์นะครับ ⚠️')
      return
    }

    // Fallback Anchor: Preserve current avatar in case upload fails
    const fallbackAvatar = avatarUrl
    setIsUploadingAvatar(true)
    setErrorMessage(null)

    try {
      // 1. Single-pass 1:1 Square Compression (256x256px JPEG, max ~25KB)
      const compressedBlob = await compressAvatarImage(file, 256, 0.85)

      // 2. Upload strictly 1 file per account (avatars/${userId}/avatar.jpg) & update Supabase DB
      const newAvatarUrl = await uploadUserAvatar(user.id, compressedBlob)

      // 3. Update local state with new avatar
      setAvatarUrl(newAvatarUrl)
      setSuccessMessage('เปลี่ยนรูปโปรไฟล์สำเร็จแล้ว ✨')
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      // Fallback: Revert to previous avatar so it's not lost
      setAvatarUrl(fallbackAvatar)
      setErrorMessage(`อัปโหลดรูปภาพไม่สำเร็จ รูปโปรไฟล์เดิมยังคงอยู่: ${err?.message || 'ข้อผิดพลาดเครือข่าย'}`)
    } finally {
      setIsUploadingAvatar(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMessage('กรุณากรอกชื่อที่ต้องการแสดงนะครับ ⚠️')
      return
    }
    if (!user?.id) return

    setErrorMessage(null)
    setIsSaving(true)

    try {
      await updateProfileDisplayName(user.id, displayName)
      setSuccessMessage('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้วครับ ✨')
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
      {/* Hidden File Input for Avatar Image Selection */}
      <input
        type="file"
        ref={avatarFileInputRef}
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

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
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2 text-xs font-bold text-red-600 shadow-2xs font-body">
          <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Avatar Hero Card with Interactive Camera Upload Badge */}
      <div className="bg-white rounded-3xl p-6 text-center shadow-xs border border-pink-100/60 mb-5 relative overflow-hidden">
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-pink-400 text-white text-3xl font-bold flex items-center justify-center shadow-md overflow-hidden border-4 border-white">
            {isUploadingAvatar ? (
              <div className="flex flex-col items-center justify-center bg-black/40 w-full h-full text-white">
                <Loader2 size={24} className="animate-spin text-white" />
              </div>
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>

          {/* Interactive Camera Button Badge */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => avatarFileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-95 transition-all"
            title="เปลี่ยนรูปโปรไฟล์ (1 รูปต่อบัญชี)"
          >
            {isUploadingAvatar ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
          </motion.button>
        </div>

        <button
          onClick={() => avatarFileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="text-xs font-bold text-[var(--color-primary)] hover:underline mb-1 inline-flex items-center gap-1 font-body cursor-pointer"
        >
          <Camera size={13} /> แตะเพื่อเปลี่ยนรูปโปรไฟล์
        </button>

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
