'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, CreditCard, Check, X, Image as ImageIcon, Upload, Crop, ZoomIn, AlertCircle, Edit3, Trash2 } from 'lucide-react'
import { useFinanceStore, Account } from '@/store/finance'
import * as AccountsDB from '@/lib/supabase/accounts'
import { createClient } from '@/lib/supabase/client'

const PRESET_ICONS = ['💵', '🏦', '👛', '💳', '🐷', '💰', '💎', '🪙', '🎒', '📱', '🎁', '⭐']
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 // 3MB Limit

export default function WalletPage() {
  const { accounts, setAccounts, addAccount, updateAccountLocal, removeAccount, selectedAccount, setSelectedAccount } = useFinanceStore()
  const supabase = createClient()
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null)

  // Create Form State
  const [newAccName, setNewAccName] = useState('')
  const [newAccBalance, setNewAccBalance] = useState('')
  const [newAccType, setNewAccType] = useState<'cash' | 'bank' | 'wallet'>('cash')
  const [selectedIcon, setSelectedIcon] = useState('💵')
  const [nameError, setNameError] = useState<string | null>(null)

  // Edit Form State
  const [editAccId, setEditAccId] = useState('')
  const [editAccName, setEditAccName] = useState('')
  const [editAccBalance, setEditAccBalance] = useState('')
  const [editAccType, setEditAccType] = useState<'cash' | 'bank' | 'wallet'>('cash')
  const [editSelectedIcon, setEditSelectedIcon] = useState('💵')
  const [isEditingMode, setIsEditingMode] = useState(false) // Toggle cropper target (create vs edit)

  // File Upload & Square Crop Modal State
  const iconFileInputRef = useRef<HTMLInputElement>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [fileError, setFileError] = useState<string | null>(null)

  const totalWalletBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  // Load accounts from Supabase on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      try {
        const accs = await AccountsDB.getAccounts(user.id)
        setAccounts(accs)
      } catch (e) {
        console.error('Failed to load accounts:', e)
      }
    }
    load()
  }, [])

  // Handle File Upload with 3MB Limit Enforcement
  const handleIconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]

    // Requirement: Must not exceed 3MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('ขนาดไฟล์รูปภาพเกิน 3MB กรุณาเลือกรูปภาพที่ไม่เกิน 3MB นะครับ ⚠️')
      if (e.target) e.target.value = ''
      return
    }

    setFileError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setRawImageSrc(event.target.result as string)
        setZoomScale(1)
        setShowCropModal(true)
      }
    }
    reader.readAsDataURL(file)
    if (e.target) e.target.value = ''
  }

  // Lock 1:1 Aspect Ratio Canvas Crop Process
  const handleApplySquareCrop = () => {
    if (!rawImageSrc) return
    const img = new Image()
    img.src = rawImageSrc
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const targetSize = 256 // Fixed 1:1 square dimensions (256x256)
      canvas.width = targetSize
      canvas.height = targetSize

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const minDim = Math.min(img.width, img.height)
      const sourceX = (img.width - minDim) / 2
      const sourceY = (img.height - minDim) / 2

      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        img,
        sourceX, sourceY, minDim, minDim,
        0, 0, targetSize, targetSize
      )

      const croppedDataUrl = canvas.toDataURL('image/png', 0.9)
      if (isEditingMode) {
        setEditSelectedIcon(croppedDataUrl)
      } else {
        setSelectedIcon(croppedDataUrl)
      }
      setShowCropModal(false)
      setRawImageSrc(null)
    }
  }

  // Handle Save New Account — persists to Supabase
  const handleCreateAccount = async () => {
    if (!newAccName.trim()) {
      setNameError('กรุณากรอกชื่อกระเป๋าเงินก่อนบันทึกนะครับ ⚠️')
      return
    }
    setNameError(null)

    const bal = parseFloat(newAccBalance) || 0
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const created = await AccountsDB.createAccount(user.id, {
        name: newAccName.trim(),
        type: newAccType,
        balance: bal,
        icon: selectedIcon,
        color: '#FF3478',
      })
      addAccount(created)
    } catch (e) {
      console.error('createAccount failed:', e)
    }
    setNewAccName('')
    setNewAccBalance('')
    setSelectedIcon('💵')
    setShowAddModal(false)
  }

  // Handle Save Edit Account — persists to Supabase
  const handleSaveEditAccount = async () => {
    if (!editAccName.trim()) return
    const bal = parseFloat(editAccBalance) || 0
    try {
      await AccountsDB.updateAccount(editAccId, {
        name: editAccName.trim(),
        type: editAccType,
        balance: bal,
        icon: editSelectedIcon,
      })
      updateAccountLocal(editAccId, {
        name: editAccName.trim(),
        type: editAccType,
        balance: bal,
        icon: editSelectedIcon,
      })
    } catch (e) {
      console.error('updateAccount failed:', e)
    }
    setShowEditModal(false)
    setShowDetailModal(false)
  }

  // Handle Delete Account — persists to Supabase
  const handleDeleteAccount = async (id: string) => {
    try {
      await AccountsDB.deleteAccount(id)
      removeAccount(id)
    } catch (e) {
      console.error('deleteAccount failed:', e)
    }
    setShowDetailModal(false)
  }

  // Open Detail Modal on Card Click
  const handleCardClick = (acc: Account) => {
    setViewingAccount(acc)
    setSelectedAccount(acc)
    setShowDetailModal(true)
  }

  // Populate Edit Form from Detail Modal
  const openEditModalFromDetail = () => {
    if (!viewingAccount) return
    setEditAccId(viewingAccount.id)
    setEditAccName(viewingAccount.name)
    setEditAccType(viewingAccount.type)
    setEditAccBalance(viewingAccount.balance.toString())
    setEditSelectedIcon(viewingAccount.icon)
    setIsEditingMode(true)
    setShowDetailModal(false)
    setShowEditModal(true)
  }

  const isCustomImage = (iconStr: string) => {
    return iconStr.startsWith('data:') || iconStr.startsWith('http') || iconStr.startsWith('blob:')
  }

  return (
    <div className="min-h-screen bg-[#FFF5F8] p-4 pb-28 font-body">
      {/* Hidden File Input for Custom Wallet Icon */}
      <input
        type="file"
        ref={iconFileInputRef}
        accept="image/*"
        onChange={handleIconFileUpload}
        className="hidden"
      />

      {/* Page Title Header */}
      <div className="flex justify-between items-center mt-2 mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={22} className="text-[var(--color-primary)]" /> กระเป๋าเงินของคุณ
          </h1>
          <p className="text-xs text-gray-400">จัดการกระเป๋าและบัญชีธนาคาร</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={() => {
            setIsEditingMode(false)
            setNameError(null)
            setShowAddModal(true)
          }}
          className="px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform font-body"
        >
          <Plus size={16} strokeWidth={2.5} /> เพิ่มกระเป๋า
        </motion.button>
      </div>

      {/* Net Wallet Balance Summary Hero Card */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="bg-gradient-to-br from-[var(--color-primary)] to-pink-500 rounded-3xl p-5 text-white shadow-lg mb-6 relative overflow-hidden"
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <p className="text-xs font-medium opacity-90 mb-1">ยอดเงินรวมทุกกระเป๋า</p>
        <h2 className="text-3xl font-bold font-mono tracking-tight mb-4">
          ฿{totalWalletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </h2>
        <div className="flex gap-4 text-xs font-semibold pt-3 border-t border-white/20">
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
            <CreditCard size={14} /> {accounts.length} บัญชีผู้ใช้
          </div>
        </div>
      </motion.div>

      {/* Wallet / Accounts List (Requirement 1: Clicking Card Opens Detail & Management Modal) */}
      <h3 className="font-bold text-sm text-gray-700 mb-3 px-1">รายการกระเป๋า (แตะเพื่อจัดการ)</h3>
      <div className="space-y-3 font-body">
        {accounts.length > 0 ? (
          accounts.map(acc => {
            const isSelected = selectedAccount?.id === acc.id
            return (
              <motion.div
                key={acc.id}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                onClick={() => handleCardClick(acc)}
                className={`bg-white p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${
                  isSelected
                    ? 'border-[var(--color-primary)] shadow-md ring-2 ring-pink-100'
                    : 'border-gray-100 shadow-2xs hover:border-pink-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shadow-2xs overflow-hidden shrink-0 border border-pink-100">
                    {isCustomImage(acc.icon) ? (
                      <img src={acc.icon} alt={acc.name} className="w-full h-full object-cover aspect-square" />
                    ) : (
                      <span className="text-2xl">{acc.icon}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-800">{acc.name}</h4>
                      {isSelected && (
                        <span className="text-[10px] bg-pink-100 text-[var(--color-primary)] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check size={10} /> ใช้งานอยู่
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {acc.type === 'cash' ? 'เงินสด' : acc.type === 'bank' ? 'ธนาคาร' : 'E-Wallet'}
                    </p>
                  </div>
                </div>

                <span className="font-bold font-mono text-base text-gray-800">
                  ฿{acc.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </motion.div>
            )
          })
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-gray-400 space-y-3 border border-pink-100 font-body">
            <p className="text-sm font-bold text-gray-600">ยังไม่มีกระเป๋าเงิน 👛</p>
            <p className="text-xs">กดปุ่ม "+ เพิ่มกระเป๋า" ด้านบนเพื่อสร้างกระเป๋าเงินแรกของคุณ</p>
          </div>
        )}
      </div>

      {/* Floating Detail & Management Popup Modal (Requirement 1) */}
      <AnimatePresence>
        {showDetailModal && viewingAccount && (
          <div 
            onClick={() => setShowDetailModal(false)}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer font-body"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default space-y-4 text-center"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-gray-400 font-body">รายละเอียดกระเป๋าเงิน</span>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* Icon & Name Hero */}
              <div className="space-y-2 py-2">
                <div className="w-16 h-16 rounded-3xl bg-pink-50 border border-pink-200 flex items-center justify-center mx-auto shadow-xs overflow-hidden">
                  {isCustomImage(viewingAccount.icon) ? (
                    <img src={viewingAccount.icon} alt={viewingAccount.name} className="w-full h-full object-cover aspect-square" />
                  ) : (
                    <span className="text-3xl">{viewingAccount.icon}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-800 font-body">{viewingAccount.name}</h3>
                <p className="text-xs text-gray-400 font-medium">
                  ประเภท: {viewingAccount.type === 'cash' ? 'เงินสด' : viewingAccount.type === 'bank' ? 'ธนาคาร' : 'E-Wallet'}
                </p>
                <div className="text-2xl font-bold font-mono text-[var(--color-primary)]">
                  ฿{viewingAccount.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex gap-2 pt-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={openEditModalFromDetail}
                  className="flex-1 py-3 rounded-2xl bg-pink-50 border border-pink-200 text-[var(--color-primary)] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs font-body"
                >
                  <Edit3 size={15} /> แก้ไขกระเป๋า
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteAccount(viewingAccount.id)}
                  className="py-3 px-4 rounded-2xl bg-red-50 border border-red-200 text-red-500 text-xs font-bold flex items-center justify-center gap-1 shadow-2xs font-body"
                >
                  <Trash2 size={15} /> ลบ
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Wallet Modal (Requirement 2: Mandatory Name Validation) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 cursor-pointer font-body"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 border border-gray-100 cursor-default max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <h3 className="font-bold text-base text-gray-800">เพิ่มกระเป๋าเงินใหม่</h3>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 touch-pan-y overscroll-contain">
                {/* Name Error Red Alert Banner (Requirement 2) */}
                {nameError && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-xs font-bold text-red-600 animate-shake font-body">
                    <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                    <span>{nameError}</span>
                  </div>
                )}

                {/* File Error Alert if size > 3MB */}
                {fileError && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-xs font-bold text-red-600 animate-shake font-body">
                    <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                    <span>{fileError}</span>
                  </div>
                )}

                {/* 1. Account Name Input */}
                <div>
                  <label className="text-xs font-bold text-gray-500">ชื่อกระเป๋า / บัญชี <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="เช่น บัญชีออมสิน, เงินสดติดกระเป๋า"
                    value={newAccName}
                    onChange={(e) => {
                      setNewAccName(e.target.value)
                      if (e.target.value.trim()) setNameError(null)
                    }}
                    className={`w-full mt-1 border rounded-2xl px-3.5 py-2.5 text-sm outline-none font-medium transition-colors font-body ${
                      nameError ? 'bg-red-50/40 border-red-400 focus:border-red-500' : 'bg-gray-50 border-gray-200 focus:border-[var(--color-primary)]'
                    }`}
                  />
                </div>

                {/* 2. Account Type */}
                <div>
                  <label className="text-xs font-bold text-gray-500">ประเภท</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { type: 'cash', label: 'เงินสด', defaultIcon: '💵' },
                      { type: 'bank', label: 'ธนาคาร', defaultIcon: '🏦' },
                      { type: 'wallet', label: 'E-Wallet', defaultIcon: '👛' },
                    ].map(item => (
                      <motion.button
                        key={item.type}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          setNewAccType(item.type as any)
                          if (!isCustomImage(selectedIcon)) {
                            setSelectedIcon(item.defaultIcon)
                          }
                        }}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                          newAccType === item.type
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 3. Icon Selection */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500">ไอคอนกระเป๋าเงิน (1:1)</label>
                    <button
                      onClick={() => {
                        setIsEditingMode(false)
                        iconFileInputRef.current?.click()
                      }}
                      className="text-[11px] font-bold text-[var(--color-primary)] bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 flex items-center gap-1 hover:bg-pink-100 transition-colors"
                    >
                      <Upload size={12} /> อัปโหลดภาพ (ไม่เกิน 3MB)
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden aspect-square">
                      {isCustomImage(selectedIcon) ? (
                        <img src={selectedIcon} alt="Custom Icon" className="w-full h-full object-cover aspect-square" />
                      ) : (
                        <span className="text-2xl">{selectedIcon}</span>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-6 gap-1 max-h-24 overflow-y-auto p-1 border border-gray-100 rounded-2xl bg-gray-50">
                      {PRESET_ICONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setSelectedIcon(emoji)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all ${
                            selectedIcon === emoji
                              ? 'bg-white border border-pink-300 shadow-2xs scale-110'
                              : 'hover:bg-white/60'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Initial Balance */}
                <div>
                  <label className="text-xs font-bold text-gray-500">ยอดเงินเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-base font-bold font-mono text-gray-800 outline-none focus:border-[var(--color-primary)] transition-colors font-body"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 shrink-0 font-body">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 font-bold text-xs text-gray-600 active:bg-gray-200"
                >
                  ยกเลิก
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleCreateAccount}
                  className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] font-bold text-xs text-white shadow-xs active:bg-pink-600"
                >
                  บันทึกกระเป๋า
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Wallet Modal (Requirement 1) */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 cursor-pointer font-body"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 border border-gray-100 cursor-default max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <h3 className="font-bold text-base text-gray-800 flex items-center gap-1.5">
                  <Edit3 size={16} className="text-[var(--color-primary)]" /> แก้ไขกระเป๋าเงิน
                </h3>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowEditModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 touch-pan-y overscroll-contain">
                <div>
                  <label className="text-xs font-bold text-gray-500">ชื่อกระเป๋า / บัญชี</label>
                  <input
                    type="text"
                    value={editAccName}
                    onChange={(e) => setEditAccName(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm outline-none font-medium focus:border-[var(--color-primary)] transition-colors font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">ประเภท</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { type: 'cash', label: 'เงินสด' },
                      { type: 'bank', label: 'ธนาคาร' },
                      { type: 'wallet', label: 'E-Wallet' },
                    ].map(item => (
                      <button
                        key={item.type}
                        onClick={() => setEditAccType(item.type as any)}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                          editAccType === item.type
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500">ไอคอนกระเป๋าเงิน (1:1)</label>
                    <button
                      onClick={() => {
                        setIsEditingMode(true)
                        iconFileInputRef.current?.click()
                      }}
                      className="text-[11px] font-bold text-[var(--color-primary)] bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 flex items-center gap-1 hover:bg-pink-100 transition-colors"
                    >
                      <Upload size={12} /> อัปโหลดภาพใหม่
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden aspect-square">
                      {isCustomImage(editSelectedIcon) ? (
                        <img src={editSelectedIcon} alt="Custom Icon" className="w-full h-full object-cover aspect-square" />
                      ) : (
                        <span className="text-2xl">{editSelectedIcon}</span>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-6 gap-1 max-h-24 overflow-y-auto p-1 border border-gray-100 rounded-2xl bg-gray-50">
                      {PRESET_ICONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setEditSelectedIcon(emoji)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all ${
                            editSelectedIcon === emoji
                              ? 'bg-white border border-pink-300 shadow-2xs scale-110'
                              : 'hover:bg-white/60'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">ยอดเงินเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    value={editAccBalance}
                    onChange={(e) => setEditAccBalance(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-base font-bold font-mono text-gray-800 outline-none focus:border-[var(--color-primary)] transition-colors font-body"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 shrink-0 font-body">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 font-bold text-xs text-gray-600 active:bg-gray-200"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={handleSaveEditAccount}
                  className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] font-bold text-xs text-white shadow-xs active:bg-pink-600"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1:1 Square Lock Image Cropper Modal */}
      <AnimatePresence>
        {showCropModal && rawImageSrc && (
          <div 
            onClick={() => setShowCropModal(false)}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 cursor-pointer font-body"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-pink-100 cursor-default text-center"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-base text-gray-800 flex items-center gap-1.5">
                  <Crop size={18} className="text-[var(--color-primary)]" /> ครอปอัจฉริยะ (อัตราส่วน 1:1 เท่าไอคอน)
                </h3>
                <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* 1:1 Locked Square Crop Viewport Canvas Frame */}
              <div className="relative w-48 h-48 mx-auto rounded-3xl overflow-hidden border-4 border-[var(--color-primary)] shadow-md bg-gray-900 flex items-center justify-center">
                <img
                  src={rawImageSrc}
                  alt="Raw upload"
                  style={{ transform: `scale(${zoomScale})` }}
                  className="w-full h-full object-cover aspect-square transition-transform"
                />

                <div className="absolute inset-0 border border-white/40 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                  <div className="border border-white/20" />
                </div>
              </div>

              {/* Zoom Slider Control */}
              <div className="space-y-1 px-4">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1"><ZoomIn size={14} /> ซูมภาพ</span>
                  <span>{Math.round(zoomScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                />
              </div>

              {/* Crop Modal Actions */}
              <div className="flex gap-2 pt-1 font-body">
                <button
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 font-bold text-xs text-gray-600 active:bg-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleApplySquareCrop}
                  className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] font-bold text-xs text-white shadow-md active:scale-95 transition-transform"
                >
                  ใช้รูปนี้ (ครอป 1:1)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
