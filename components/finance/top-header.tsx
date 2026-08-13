'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFinanceStore } from '@/store/finance'

interface HeaderProps {
  userName: string
  avatarUrl?: string
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function TopHeader({ userName, avatarUrl, activeTab, onTabChange }: HeaderProps) {
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const { setPendingScanFile } = useFinanceStore()
  const tabs = ['ภาพรวม', 'เป้าหมาย', 'รายงาน']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setPendingScanFile(files[0])
      router.push('/add')
    }
  }

  return (
    <header className="pt-4 pb-2 px-4 bg-[#FFF0F5]/80 backdrop-blur-md sticky top-0 z-40 border-b border-pink-100/50 font-body">
      {/* Native Direct Mobile Camera Capture Input */}
      <input 
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Gallery Photo Picker Input */}
      <input 
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* User profile row */}
      <div className="flex items-center justify-between mb-3 font-body">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <motion.div 
            className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-xs bg-white flex items-center justify-center text-lg shrink-0"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              '🐱'
            )}
          </motion.div>
          <div>
            <h1 className="font-display font-bold text-base text-gray-800">{userName || 'Yotsakon Saikanya'}</h1>
          </div>
        </motion.div>

        {/* Action Buttons: Direct Camera Capture + Gallery Photo Picker */}
        <div className="flex items-center gap-2">
          {/* Direct Camera Launch Button */}
          <motion.button 
            whileTap={{ scale: 0.85, rotate: -10 }}
            onClick={() => cameraInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-white border border-pink-100 flex items-center justify-center text-gray-700 shadow-2xs active:scale-90 transition-transform"
            title="ถ่ายรูปสลิปด้วยกล้องมือถือ"
          >
            <Camera size={18} />
          </motion.button>

          {/* Gallery Picker Button */}
          <motion.button 
            whileTap={{ scale: 0.85, rotate: 10 }}
            onClick={() => galleryInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-white border border-pink-200 text-[var(--color-primary)] flex items-center justify-center shadow-2xs active:scale-90 transition-transform"
            title="เลือกรูปสลิปจากแกลลอรี่"
          >
            <ImageIcon size={18} />
          </motion.button>
        </div>
      </div>

      {/* Top 3 Menu Tabs (Centered & Soft Pink Theme) */}
      <div className="flex items-center justify-center gap-2 py-1 text-sm font-body">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <motion.button
              key={tab}
              onClick={() => onTabChange(tab)}
              whileTap={{ scale: 0.88 }}
              className={`relative px-6 py-1.5 rounded-full text-xs font-bold transition-colors z-10 ${
                isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTopTab"
                  className="absolute inset-0 bg-[var(--color-primary)] rounded-full shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {tab}
            </motion.button>
          )
        })}
      </div>
    </header>
  )
}
