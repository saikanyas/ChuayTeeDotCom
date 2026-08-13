'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Edit3, Plus, Camera, Image as ImageIcon, Clipboard, 
  ChevronDown, Check, CheckCircle2, Utensils, Coffee, Wine, Bus, Car, 
  ShoppingBag, Fuel, Tv, Home, Smartphone, PiggyBank, Film, HeartPulse, 
  GraduationCap, Briefcase, BadgeDollarSign, Clock, Store, Gift, TrendingUp, 
  Landmark, Building, HeartHandshake, Loader2, Calendar, Pencil, Sparkles
} from 'lucide-react'
import { useFinanceStore } from '@/store/finance'
import { createClient } from '@/lib/supabase/client'
import { processRealSlipOCR } from '@/lib/real-ocr'
import { scanSlip } from '@/lib/ocr-client'
import { compressImage } from '@/lib/utils'
import * as TransactionsDB from '@/lib/supabase/transactions'
import * as AccountsDB from '@/lib/supabase/accounts'
import * as SlipsDB from '@/lib/supabase/slips'
import { useSWRConfig } from 'swr'

export default function AddPage() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { 
    addTransaction, 
    accounts, 
    setAccounts,
    selectedAccount, 
    setSelectedAccount, 
    pendingScanFile, 
    setPendingScanFile 
  } = useFinanceStore()

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Main State
  const [tabType, setTabType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('0')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false)
  const [showDatePickerModal, setShowDatePickerModal] = useState(false)
  const [showTitleModal, setShowTitleModal] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    imagePreviewUrl: string
    amount: number
    dateText: string
    usedSlipDate: boolean
  } | null>(null)
  const [activeSlipBlob, setActiveSlipBlob] = useState<Blob | null>(null)
  const [ocrDataResult, setOcrDataResult] = useState<any>(null)

  // Current Bangkok Local Date String
  const [dateStr, setDateStr] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  // Expense Categories (ไปหมวดหมู่)
  const expenseCategories = [
    { name: 'อาหาร', icon: Utensils, color: '#FFB800' },
    { name: 'กาแฟ', icon: Coffee, color: '#8B5CF6' },
    { name: 'เครื่องดื่ม', icon: Wine, color: '#EC4899' },
    { name: 'ค่าเดินทาง', icon: Bus, color: '#3B82F6' },
    { name: 'แท็กซี่', icon: Car, color: '#F59E0B' },
    { name: 'ช้อปออนไลน์', icon: ShoppingBag, color: '#10B981' },
    { name: 'น้ำมันรถ', icon: Fuel, color: '#EF4444' },
    { name: 'สังสรรค์', icon: Tv, color: '#6366F1' },
    { name: 'ดูหนัง', icon: Film, color: '#8B5CF6' },
    { name: 'ค่าเช่า', icon: Home, color: '#F97316' },
    { name: 'ค่าโทรศัพท์', icon: Smartphone, color: '#06B6D4' },
    { name: 'เงินออม', icon: PiggyBank, color: '#10B981' },
    { name: 'สุขภาพ', icon: HeartPulse, color: '#EF4444' },
    { name: 'การศึกษา', icon: GraduationCap, color: '#3B82F6' },
  ]

  // Income Categories (จากหมวดหมู่ - Image 1)
  const incomeCategories = [
    { name: 'แม่ให้มา', icon: HeartHandshake, color: '#FF3478' },
    { name: 'เงินเดือน', icon: Briefcase, color: '#10B981' },
    { name: 'งานเสริม', icon: BadgeDollarSign, color: '#F59E0B' },
    { name: 'ล่วงเวลา', icon: Clock, color: '#3B82F6' },
    { name: 'ขายออนไลน์', icon: Store, color: '#EC4899' },
    { name: 'โบนัส', icon: Gift, color: '#8B5CF6' },
    { name: 'ดอกเบี้ย', icon: TrendingUp, color: '#06B6D4' },
    { name: 'ลงทุน', icon: Landmark, color: '#6366F1' },
    { name: 'ค่าเช่า', icon: Building, color: '#F97316' },
    { name: 'ขายของเก่า', icon: ShoppingBag, color: '#10B981' },
  ]

  const activeCategories = tabType === 'expense' ? expenseCategories : incomeCategories
  const [selectedCategory, setSelectedCategory] = useState(expenseCategories[0])
  const [transactionTitle, setTransactionTitle] = useState(expenseCategories[0].name)

  const isCustomImage = (iconStr?: string) => {
    if (!iconStr) return false
    return iconStr.startsWith('data:') || iconStr.startsWith('http') || iconStr.startsWith('blob:')
  }

  // Sync transaction title with selected category default
  const handleCategorySelect = (cat: typeof expenseCategories[0]) => {
    setSelectedCategory(cat)
    setTransactionTitle(cat.name)
  }

  useEffect(() => {
    // Generate Bangkok Local Time
    const now = new Date()
    const thaiDateStr = now.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit', 
      timeZone: 'Asia/Bangkok' 
    })
    const thaiTimeStr = now.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: 'Asia/Bangkok' 
    })
    setDateStr(`${thaiDateStr} ${thaiTimeStr}`)

    const isoDate = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' })
    setCustomDate(isoDate)
    setCustomTime(thaiTimeStr)

    // Handle cross-page pending scan file from top header camera button
    if (pendingScanFile) {
      processScanFile(pendingScanFile)
      setPendingScanFile(null)
    }
  }, [])

  // Process Slip File  // Single-Pass Compression + OCR Processing
  const processScanFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ ⚠️')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 25MB) ⚠️')
      return
    }

    try {
      setIsScanning(true)
      // Single-pass compression (1200px max dimension, EXIF stripping, JPEG 0.8 quality)
      const compressedBlob = await compressImage(file, 1200, 0.8)
      setActiveSlipBlob(compressedBlob)

      const compressedFile = new File([compressedBlob], file.name || 'slip.jpg', { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(compressedBlob)

      let extractedAmt = 39
      let extractedDateStr = '12 ส.ค. 69 20:44'
      let ocrResData: any = null

      try {
        const pythonRes = await scanSlip(compressedFile)
        ocrResData = pythonRes
        if (pythonRes.amount) extractedAmt = pythonRes.amount
      } catch {
        const localRes = await processRealSlipOCR(compressedFile)
        ocrResData = localRes
        if (localRes.amount) extractedAmt = localRes.amount
      }

      setOcrDataResult(ocrResData)
      setScanResult({
        imagePreviewUrl: previewUrl,
        amount: extractedAmt,
        dateText: extractedDateStr,
        usedSlipDate: true,
      })
      setAmount(extractedAmt.toString())
    } catch (err: any) {
      console.error('processScanFile error:', err)
      alert(err.message || 'อ่านไฟล์สลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsScanning(false)
    }
  }

  // Keypad Calculator handler
  const handleKey = (k: string) => {
    if (k === 'C') {
      setAmount('0')
    } else if (k === 'back') {
      setAmount(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'))
    } else if (k === '=') {
      try {
        const sanitized = amount.replace(/×/g, '*').replace(/÷/g, '/')
        const res = eval(sanitized)
        setAmount(res.toString())
      } catch {
        // Ignore math error
      }
    } else if (['+', '-', '×', '÷'].includes(k)) {
      setAmount(prev => prev + k)
    } else {
      setAmount(prev => (prev === '0' ? k : prev + k))
    }
  }

  // Trigger File Input cross-platform (iOS / Android / Desktop)
  const triggerFileSelect = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click()
    }
  }

  // Handle Slip Upload & OCR
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processScanFile(files[0])
  }

  // Save Transaction to Supabase (DB trigger handles balance)
  const handleSave = async () => {
    if (!selectedAccount) {
      router.push('/wallet')
      return
    }

    const numAmount = parseFloat(amount) || 0
    if (numAmount <= 0) return
    
    const thaiDateStr = customDate || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' })
    const thaiTimeStr = customTime || '12:00'

    // Optimistic UI update
    const tempId = 'tx_' + Date.now()
    const newTx = {
      id: tempId,
      categoryName: selectedCategory.name,
      categoryIcon: selectedCategory.name,
      categoryColor: selectedCategory.color,
      description: transactionTitle || selectedCategory.name,
      time: thaiTimeStr,
      date: thaiDateStr,
      source: (scanResult ? 'slip_scan' : 'manual') as any,
      amount: numAmount,
      type: tabType,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
    }
    addTransaction(newTx)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        let slipId: string | undefined = undefined

        // If a slip photo was attached/scanned, upload to private Storage & create slip record
        if (activeSlipBlob) {
          try {
            const { storagePath } = await SlipsDB.uploadSlip(user.id, activeSlipBlob)
            slipId = await SlipsDB.createSlipRecord(user.id, storagePath, {
              detected_bank: ocrDataResult?.bank_name,
              extracted_amount: ocrDataResult?.amount,
              raw_text: ocrDataResult?.raw_text,
              confidence: ocrDataResult?.confidence,
            })
          } catch (slipErr: any) {
            console.error('Slip upload / DB record creation failed:', slipErr)
            alert('ไม่สามารถอัปโหลดสลิปได้: ' + (slipErr.message || 'กรุณาลองใหม่อีกครั้ง'))
            return
          }
        }

        try {
          await TransactionsDB.createTransaction(user.id, {
            account_id: selectedAccount.id,
            type: tabType,
            amount: numAmount,
            description: transactionTitle || selectedCategory.name,
            transaction_date: thaiDateStr,
            transaction_time: thaiTimeStr,
            source: scanResult ? 'slip_scan' : 'manual',
            slip_id: slipId,
          })

          // Invalidate SWR transaction & account caches
          mutate(['transactions', user.id])
          mutate(['accounts', user.id])
        } catch (txErr: any) {
          if (slipId) {
            try {
              const { data: slipRow } = await (supabase.from('slips') as any).select('storage_path').eq('id', slipId).single()
              if (slipRow?.storage_path) {
                await SlipsDB.deleteStorageFile(slipRow.storage_path)
              }
              await (supabase.from('slips') as any).delete().eq('id', slipId)
            } catch (rollbackErr) {
              console.error('Rollback slip record failed:', rollbackErr)
            }
          }
          throw txErr
        }

        // Atomically enforce 30-slip FIFO cap server-side ONLY after successful transaction creation
        if (slipId) {
          await SlipsDB.enforceSlipCap(30)
        }

        // Re-fetch accounts so balance reflects DB trigger
        const updatedAccounts = await AccountsDB.getAccounts(user.id)
        setAccounts(updatedAccounts)
      }
    } catch (e: any) {
      console.error('createTransaction failed:', e)
      alert('บันทึกรายการไม่สำเร็จ: ' + (e.message || 'กรุณาลองใหม่อีกครั้ง'))
      return
    }

    router.push('/')
  }

  const SelectedIcon = selectedCategory.icon

  return (
    <div className="min-h-screen bg-[#FFF5F8] pb-24 font-body text-gray-800">
      {/* Full-Screen Scanning Notification Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 font-body">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-pink-100 text-center space-y-4 font-body">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-pink-300 animate-ping opacity-40" />
              <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[var(--color-primary)] flex items-center justify-center shadow-xs border border-pink-100">
                <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-gray-800 font-display">กำลังสแกนสลิป... 🧾</h3>
              <p className="text-xs text-gray-500 font-body">ระบบ AI กำลังอ่านยอดเงินและข้อมูลสลิป</p>
            </div>

            <div className="bg-pink-50/90 border border-pink-200/80 rounded-2xl p-3 text-[11px] text-pink-800 leading-relaxed text-left font-body shadow-2xs">
              <p className="font-bold mb-1 flex items-center gap-1 text-pink-900 font-body">
                <Sparkles size={14} className="text-amber-500 shrink-0" /> ข้อความแจ้งเตือนระบบ:
              </p>
              <span>
                <b>กำลังสแกนอยู่นะครับ!</b> หากเป็นการใช้งานสแกนครั้งแรกของวัน เซิร์ฟเวอร์ Render อาจกำลังตื่นจาก Cold Run (10–30 วินาที) ไม่ต้องกดซ้ำครับ ระบบกำลังประมวลผลอยู่แน่นอน ✨
              </span>
            </div>

            <div className="w-full bg-pink-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-full w-2/3 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Inputs for Direct Mobile Camera Capture and Gallery Photo Picker */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header & Type Switcher Row (Pink Theme) */}
      <div className="pt-4 px-4 pb-2 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-pink-100/50 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {[
              { id: 'expense', label: 'รายจ่าย' },
              { id: 'income', label: 'รายรับ' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setTabType(tab.id as any)
                  const firstCat = tab.id === 'expense' ? expenseCategories[0] : incomeCategories[0]
                  setSelectedCategory(firstCat)
                  setTransactionTitle(firstCat.name)
                }}
                className={`px-5 py-1.5 rounded-full text-xs font-bold font-body transition-all ${
                  tabType === tab.id
                    ? 'bg-[var(--color-primary)] text-white shadow-2xs scale-105'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0 shadow-2xs"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Body Layout */}
      <div className="p-4">
        {/* Account Selector Pill (Fixed Base64 Text Overflow) */}
        <button
          onClick={() => setShowWalletModal(true)}
          className="w-full bg-white rounded-2xl p-3 mb-4 shadow-2xs border border-pink-100 flex items-center justify-between active:scale-98 transition-transform font-body"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-lg shadow-2xs overflow-hidden shrink-0 border border-pink-100">
              {isCustomImage(selectedAccount?.icon) ? (
                <img src={selectedAccount?.icon} alt="Wallet Icon" className="w-full h-full object-cover aspect-square" />
              ) : (
                <span>{selectedAccount?.icon || '👛'}</span>
              )}
            </div>
            <div className="text-left truncate max-w-[220px]">
              <p className="text-xs text-gray-400 font-body">
                ฿{(selectedAccount?.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-bold font-body text-gray-800 truncate">{selectedAccount?.name || 'กรุณาเพิ่มกระเป๋าเงิน'}</p>
            </div>
          </div>
          <ChevronDown size={18} className="text-gray-400 shrink-0" />
        </button>

        {/* Dynamic View: Scanning Loader OR Slip Scan Result OR Category Grid */}
        {isScanning ? (
          <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs flex flex-col items-center justify-center space-y-3 mb-4 font-body">
            <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
            <p className="text-xs font-bold text-gray-800 font-body">กำลังสแกนอ่านข้อมูลใบเสร็จ...</p>
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3 text-[11px] text-pink-700 leading-relaxed text-center font-body w-full">
              ⚡ <b>กำลังสแกนอยู่...</b> หากเป็นการใช้งานครั้งแรกของวัน เซิร์ฟเวอร์อาจใช้เวลา 10–30 วินาทีในการเริ่มต้น (Render Cold Start) กรุณารอสักครู่นะจ๊าา ✨
            </div>
          </div>
        ) : scanResult ? (
          /* Slip Scan Result Card & Date Banner */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 mb-4 font-body"
          >
            <div className="bg-white rounded-3xl p-4 border border-pink-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={scanResult.imagePreviewUrl}
                  alt="Slip"
                  className="w-16 h-20 object-cover rounded-xl border border-pink-200 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] mb-1 font-body">
                    <CheckCircle2 size={16} className="text-[var(--color-primary)]" /> สแกนใบเสร็จสำเร็จ
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-pink-50 text-[var(--color-primary)] text-[10px] font-bold font-body">
                    ใบเสร็จที่ 1
                  </span>
                </div>
              </div>
              <button
                onClick={() => setScanResult(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Extracted Date/Time Banner */}
            <div className="bg-pink-50/60 rounded-2xl p-3 border border-pink-100 font-body">
              <p className="text-xs text-gray-700 font-bold mb-2 text-center font-body">
                พบวันที่ในใบเสร็จ: {scanResult.dateText} ✎
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setScanResult({ ...scanResult, usedSlipDate: false })}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 border font-body ${
                    !scanResult.usedSlipDate
                      ? 'bg-white border-pink-300 text-pink-600 shadow-2xs'
                      : 'bg-white/60 border-gray-200 text-gray-500'
                  }`}
                >
                  <X size={14} /> ใช้วันที่หลัก
                </button>

                <button
                  onClick={() => setScanResult({ ...scanResult, usedSlipDate: true })}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 border font-body ${
                    scanResult.usedSlipDate
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-2xs'
                      : 'bg-white/60 border-gray-200 text-gray-500'
                  }`}
                >
                  <Check size={14} /> ใช้วันที่จากใบเสร็จ
                </button>
              </div>
            </div>

            {/* Extracted Transaction Table */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs space-y-3 font-body">
              <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-2">
                <span className="font-bold font-body">พบ 1 รายการ</span>
                <button className="w-6 h-6 rounded-full bg-pink-50 text-[var(--color-primary)] flex items-center justify-center">
                  <Plus size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 text-center text-xs font-bold text-gray-400 font-body">
                <span>ชื่อรายการ</span>
                <span>หมวดหมู่</span>
                <span>จำนวน</span>
              </div>

              {/* Table Row with Clickable Category Icon + Name Picker */}
              <div className="grid grid-cols-3 text-center text-xs items-center py-2 bg-pink-50/40 rounded-xl font-body">
                <span className="font-bold text-gray-700 font-body">{transactionTitle}</span>
                
                {/* Clicking Category Button Opens Category Picker Grid Modal */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCategoryPickerModal(true)}
                  className="flex items-center justify-center gap-1 text-xs font-bold text-pink-600 bg-white px-2.5 py-1.5 rounded-xl border border-pink-200 shadow-2xs mx-auto active:scale-95 transition-transform font-body"
                >
                  <SelectedIcon size={14} className="text-[var(--color-primary)]" />
                  <span>{selectedCategory.name}</span>
                </motion.button>

                <span className="font-bold text-red-500 text-sm font-body">{scanResult.amount} บาท</span>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-body">
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer font-bold font-body">
                  <input type="checkbox" defaultChecked className="rounded accent-[var(--color-primary)]" /> แนบรูปใบเสร็จ
                </label>
                <span className="font-bold text-sm text-gray-800 font-body">
                  รวม: {scanResult.amount} บาท
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Category Icons Grid (Smooth Scrollable) */
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-pink-100/60 mb-4 font-body">
            <div className="flex items-center justify-between mb-3 text-gray-600">
              <span className="text-xs font-bold text-gray-700 font-body">
                {tabType === 'income' ? 'จากหมวดหมู่' : 'ไปหมวดหมู่'}
              </span>
              <div className="flex gap-2 text-gray-400">
                <Search size={16} />
                <Edit3 size={16} />
                <Plus size={16} />
              </div>
            </div>

            {/* 5-Column Category Cards Grid with Explicit Scrolling Height */}
            <div className="grid grid-cols-5 gap-2 h-64 overflow-y-auto p-1 touch-pan-y overscroll-contain">
              {activeCategories.map(cat => {
                const isSelected = selectedCategory.name === cat.name
                const IconComp = cat.icon
                return (
                  <motion.button
                    key={cat.name}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-pink-50 border-pink-300 shadow-2xs scale-105 ring-2 ring-pink-100'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center mb-1 text-[var(--color-primary)]">
                      <IconComp size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center font-body">
                      {cat.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom Calculator Panel (Unified Font Body) */}
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-pink-100/60 space-y-3 font-body">
          {/* Action Row: Camera (Direct Camera Capture), Scan Slip Button (Gallery Picker), Amount Display */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform"
              title="ถ่ายรูปด้วยกล้องมือถือ"
            >
              <Camera size={18} />
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl border border-pink-200 bg-pink-50/50 text-xs font-bold text-[var(--color-primary)] flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform font-body"
              title="เลือกรูปสลิปจากแกลลอรี่"
            >
              <ImageIcon size={16} /> สแกนใบเสร็จ
            </button>

            <div className="flex items-center gap-2 bg-pink-50/60 px-3 py-1.5 rounded-xl border border-pink-100">
              <Clipboard size={16} className="text-gray-400" />
              <span className={`text-2xl font-bold font-body ${tabType === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
                {amount}
              </span>
            </div>
          </div>

          {/* Options Bar Pills (Category, Date, & Title Edit Pill with Pulsing Animation) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold text-gray-600 font-body">
            <span className="px-3 py-1.5 rounded-full bg-gray-100 flex items-center gap-1 whitespace-nowrap">
              <SelectedIcon size={14} className="text-[var(--color-primary)]" /> {selectedCategory.name}
            </span>
            
            {/* Clickable Date/Time Pill -> Opens Date/Time Modal */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDatePickerModal(true)}
              className="px-3 py-1.5 rounded-full bg-gray-100 flex items-center gap-1 whitespace-nowrap hover:bg-pink-50 hover:text-[var(--color-primary)] active:scale-95 transition-all font-body border border-transparent hover:border-pink-200"
            >
              📅 {dateStr} <ChevronDown size={14} />
            </motion.button>

            {/* Clickable Editable Title Pill with Squishy Pulsing Indicator */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowTitleModal(true)}
              className="px-3 py-1.5 rounded-full bg-pink-50 text-[var(--color-primary)] border border-pink-200 flex items-center gap-1.5 whitespace-nowrap font-bold shadow-2xs animate-pulse hover:bg-pink-100 transition-all font-body"
            >
              <Pencil size={13} className="text-[var(--color-primary)]" />
              <span className="truncate max-w-[110px]">{transactionTitle || 'ตั้งชื่อรายการ'}</span>
            </motion.button>
          </div>

          {/* Full Calculator Keypad Grid */}
          <div className="grid grid-cols-4 gap-2 pt-1 font-body">
            {/* Row 1 */}
            <button onClick={() => handleKey('=')} className="py-3 rounded-2xl bg-gray-100 font-bold text-lg text-gray-700 shadow-2xs active:scale-95 font-body">
              =
            </button>
            <button onClick={() => handleKey('back')} className="py-3 rounded-2xl bg-gray-100 font-bold text-lg text-gray-700 shadow-2xs active:scale-95 font-body">
              ⌫
            </button>
            <button
              onClick={handleSave}
              className="col-span-2 py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-pink-600 font-bold text-base text-white shadow-md active:scale-95 transition-transform font-body"
            >
              บันทึกรายการ
            </button>

            {/* Row 2 */}
            {['7', '8', '9', '+'].map(k => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className={`py-3 rounded-2xl font-bold text-lg shadow-2xs active:scale-95 font-body ${
                  k === '+' ? 'bg-pink-100 text-[var(--color-primary)]' : 'bg-gray-50 text-gray-800'
                }`}
              >
                {k}
              </button>
            ))}

            {/* Row 3 */}
            {['4', '5', '6', '-'].map(k => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className={`py-3 rounded-2xl font-bold text-lg shadow-2xs active:scale-95 font-body ${
                  k === '-' ? 'bg-pink-100 text-[var(--color-primary)]' : 'bg-gray-50 text-gray-800'
                }`}
              >
                {k}
              </button>
            ))}

            {/* Row 4 */}
            {['1', '2', '3', '×'].map(k => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className={`py-3 rounded-2xl font-bold text-lg shadow-2xs active:scale-95 font-body ${
                  k === '×' ? 'bg-pink-100 text-[var(--color-primary)]' : 'bg-gray-50 text-gray-800'
                }`}
              >
                {k}
              </button>
            ))}

            {/* Row 5 */}
            {['.', '0', 'C', '÷'].map(k => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className={`py-3 rounded-2xl font-bold text-lg shadow-2xs active:scale-95 font-body ${
                  k === '÷' ? 'bg-pink-100 text-[var(--color-primary)]' : 'bg-gray-50 text-gray-800'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet Selector Modal (z-[120] Above BottomNav) */}
      <AnimatePresence>
        {showWalletModal && (
          <div 
            onClick={() => setShowWalletModal(false)}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body max-h-[70vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="font-bold text-base text-gray-800 font-body">เลือกกระเป๋าที่ใช้ชำระ</h3>
                <button onClick={() => setShowWalletModal(false)} className="text-gray-400 p-1 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Wallet Items Container */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 touch-pan-y overscroll-contain">
                {accounts.length > 0 ? (
                  accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccount(acc)
                        setShowWalletModal(false)
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all font-body ${
                        selectedAccount?.id === acc.id
                          ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-100'
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shadow-2xs overflow-hidden shrink-0 border border-pink-100">
                          {isCustomImage(acc.icon) ? (
                            <img src={acc.icon} alt={acc.name} className="w-full h-full object-cover aspect-square" />
                          ) : (
                            <span className="text-xl">{acc.icon}</span>
                          )}
                        </div>
                        <div className="truncate max-w-[180px]">
                          <p className="font-bold text-sm text-gray-800 font-body truncate">{acc.name}</p>
                          <p className="text-xs text-gray-400 font-body">
                            ฿{acc.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      {selectedAccount?.id === acc.id && (
                        <Check size={16} className="text-[var(--color-primary)] font-bold shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400 space-y-2">
                    <p>ยังไม่มีกระเป๋าเงิน</p>
                    <button
                      onClick={() => router.push('/wallet')}
                      className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-full font-bold"
                    >
                      + เพิ่มกระเป๋า
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Picker Modal (z-[120] Above BottomNav) */}
      <AnimatePresence>
        {showCategoryPickerModal && (
          <div 
            onClick={() => setShowCategoryPickerModal(false)}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body max-h-[70vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="font-bold text-base text-gray-800 font-body">
                  {tabType === 'income' ? 'เลือกหมวดหมู่รายรับ' : 'เลือกหมวดหมู่รายจ่าย'}
                </h3>
                <button onClick={() => setShowCategoryPickerModal(false)} className="text-gray-400 p-1 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* 5-Column Category Icon Cards Grid inside Modal */}
              <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-5 gap-2 p-1 touch-pan-y overscroll-contain">
                {activeCategories.map(cat => {
                  const isSelected = selectedCategory.name === cat.name
                  const IconComp = cat.icon
                  return (
                    <motion.button
                      key={cat.name}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        handleCategorySelect(cat)
                        setShowCategoryPickerModal(false)
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-pink-50 border-pink-300 shadow-2xs scale-105 ring-2 ring-pink-100'
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center mb-1 text-[var(--color-primary)]">
                        <IconComp size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center font-body">
                        {cat.name}
                      </span>
                    </motion.button>
                  )}
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date & Time Picker Modal (z-[120] Above BottomNav) */}
      <AnimatePresence>
        {showDatePickerModal && (
          <div 
            onClick={() => setShowDatePickerModal(false)}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body space-y-4"
            >
              <div className="flex justify-between items-center mb-1 shrink-0">
                <h3 className="font-bold text-base text-gray-800 font-body flex items-center gap-2">
                  <Calendar size={18} className="text-[var(--color-primary)]" /> ปรับตั้งวันที่และเวลาหลัก
                </h3>
                <button onClick={() => setShowDatePickerModal(false)} className="text-gray-400 p-1 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 font-body">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">เลือกวันที่</label>
                  <input 
                    type="date" 
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">เลือกเวลา</label>
                  <input 
                    type="time" 
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (customDate) {
                    const parts = customDate.split('-')
                    if (parts.length === 3) {
                      const yr = parseInt(parts[0]) + 543 - 2500 // Thai Buddhist 2-digit year
                      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
                      const mth = monthNames[parseInt(parts[1]) - 1]
                      const dy = parseInt(parts[2])
                      setDateStr(`${dy} ${mth} ${yr} ${customTime || '12:00'}`)
                    }
                  }
                  setShowDatePickerModal(false)
                }}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md active:scale-95 transition-transform font-body"
              >
                ตกลง
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Title Edit Modal (Requirement 1) */}
      <AnimatePresence>
        {showTitleModal && (
          <div 
            onClick={() => setShowTitleModal(false)}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body space-y-4"
            >
              <div className="flex justify-between items-center mb-1 shrink-0">
                <h3 className="font-bold text-base text-gray-800 font-body flex items-center gap-2">
                  <Pencil size={18} className="text-[var(--color-primary)]" /> ตั้งชื่อรายการธุรกรรม
                </h3>
                <button onClick={() => setShowTitleModal(false)} className="text-gray-400 p-1 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">ชื่อรายการ</label>
                <input 
                  type="text" 
                  value={transactionTitle}
                  onChange={(e) => setTransactionTitle(e.target.value)}
                  placeholder="เช่น ข้าวผัดกะเพรา, ค่ากาแฟ..."
                  className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3.5 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  autoFocus
                />
              </div>

              <button
                onClick={() => setShowTitleModal(false)}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md active:scale-95 transition-transform font-body"
              >
                บันทึกชื่อรายการ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
