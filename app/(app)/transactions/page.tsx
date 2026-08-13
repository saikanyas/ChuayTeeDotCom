'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TransactionItem from '@/components/finance/transaction-item'
import { useFinanceStore } from '@/store/finance'
import { createClient } from '@/lib/supabase/client'
import * as TransactionsDB from '@/lib/supabase/transactions'
import * as AccountsDB from '@/lib/supabase/accounts'
import { 
  Search, X, Camera, Calendar, Wallet, Trash2, Tag, FileText, Edit3, Check, ChevronDown, Loader2,
  Utensils, Coffee, Wine, Bus, Car, ShoppingBag, Fuel, Tv, Film, Home, Smartphone, 
  PiggyBank, HeartPulse, GraduationCap, HeartHandshake, Briefcase, BadgeDollarSign, Gift
} from 'lucide-react'
import { getCachedSignedSlipUrl } from '@/lib/cache/slip-url-cache'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useSWRConfig } from 'swr'
import { formatThaiCurrency, getLucideCategoryIcon } from '@/lib/utils'

const ALL_CATEGORIES = [
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
  { name: 'แม่ให้มา', icon: HeartHandshake, color: '#FF3478' },
  { name: 'เงินเดือน', icon: Briefcase, color: '#10B981' },
  { name: 'งานเสริม', icon: BadgeDollarSign, color: '#F59E0B' },
  { name: 'โบนัส', icon: Gift, color: '#8B5CF6' },
]

export default function TransactionsPage() {
  const { transactions, setTransactions, updateTransaction, deleteTransaction, accounts, setAccounts } = useFinanceStore()
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const [showFullSlipModal, setShowFullSlipModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDatePickerModal, setShowDatePickerModal] = useState(false)

  // Edit Form State
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editAccount, setEditAccount] = useState(accounts[0])
  const [editCategory, setEditCategory] = useState(ALL_CATEGORIES[0])

  const supabase = createClient()
  const { mutate } = useSWRConfig()

  const { transactions: swrTxs } = useTransactions(user?.id)
  const { accounts: swrAccs } = useAccounts(user?.id)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (swrTxs && JSON.stringify(swrTxs) !== JSON.stringify(transactions)) {
      setTransactions(swrTxs)
    }
  }, [swrTxs, transactions, setTransactions])

  useEffect(() => {
    if (swrAccs && JSON.stringify(swrAccs) !== JSON.stringify(accounts)) {
      setAccounts(swrAccs)
    }
  }, [swrAccs, accounts, setAccounts])

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' ? true : t.type === filterType
    return matchesSearch && matchesType
  })

  const handleDelete = async (id: string) => {
    try {
      await TransactionsDB.deleteTransaction(id)
      deleteTransaction(id)
      if (user?.id) {
        mutate(['transactions', user.id])
        mutate(['accounts', user.id])
      }
    } catch (e) {
      console.error('deleteTransaction failed:', e)
    }
    setSelectedTx(null)
  }

  const [signedSlipUrl, setSignedSlipUrl] = useState<string | null>(null)
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState(false)

  useEffect(() => {
    async function loadSignedUrl() {
      if (!selectedTx?.slipUrl) {
        setSignedSlipUrl(null)
        return
      }
      setIsLoadingSignedUrl(true)
      const url = await getCachedSignedSlipUrl(selectedTx.slipUrl, 600)
      setSignedSlipUrl(url)
      setIsLoadingSignedUrl(false)
    }
    loadSignedUrl()
  }, [selectedTx])

  // Populate Edit Form
  const openEditModal = () => {
    if (!selectedTx) return
    setEditTitle(selectedTx.description || selectedTx.categoryName)
    setEditAmount(selectedTx.amount.toString())
    setEditDate(selectedTx.date || '2026-08-13')
    setEditTime(selectedTx.time || '12:00')
    const foundAcc = accounts.find(a => a.name === selectedTx.accountName) || accounts[0]
    setEditAccount(foundAcc)
    const foundCat = ALL_CATEGORIES.find(c => c.name === selectedTx.categoryName) || ALL_CATEGORIES[0]
    setEditCategory(foundCat)
    setShowEditModal(true)
  }

  // Save Edit
  const handleSaveEdit = async () => {
    if (!selectedTx) return
    const numAmt = parseFloat(editAmount) || selectedTx.amount

    const updatedData = {
      description: editTitle,
      amount: numAmt,
      date: editDate,
      time: editTime,
      accountId: editAccount?.id,
      accountName: editAccount?.name,
      categoryName: editCategory.name,
      categoryColor: editCategory.color
    }

    try {
      await TransactionsDB.updateTransaction(selectedTx.id, {
        description: editTitle,
        amount: numAmt,
        transaction_date: editDate,
        transaction_time: editTime,
        account_id: editAccount?.id,
      })
      if (user?.id) {
        mutate(['transactions', user.id])
        mutate(['accounts', user.id])
      }
    } catch (e) {
      console.error('updateTransaction failed:', e)
    }

    updateTransaction(selectedTx.id, updatedData)
    setSelectedTx({ ...selectedTx, ...updatedData })
    setShowEditModal(false)
  }

  return (
    <div className="min-h-screen bg-[#FFF5F8] p-4 pb-28 font-body text-gray-800">
      <h1 className="text-xl font-display font-bold text-gray-800 mb-4 mt-2">ประวัติธุรกรรม</h1>

      {/* Search & Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหารายการ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-2xl pl-9 pr-4 py-2.5 text-sm border border-pink-100 outline-none focus:border-[var(--color-primary)] font-body shadow-2xs"
          />
        </div>
      </div>

      {/* Filter Chips: ทั้งหมด | รายจ่าย | รายรับ */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'expense', label: 'รายจ่าย' },
          { id: 'income', label: 'รายรับ' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold font-body transition-all ${
              filterType === f.id
                ? 'bg-[var(--color-primary)] text-white shadow-2xs scale-105'
                : 'bg-white text-gray-600 border border-pink-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-pink-100">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(t => (
            <TransactionItem 
              key={t.id} 
              {...t as any} 
              onClick={() => setSelectedTx(t)}
            />
          ))
        ) : (
          <div className="p-12 text-center text-gray-400 text-sm font-body">
            ไม่พบรายการธุรกรรม 📝
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (() => {
          const ModalCatIcon = getLucideCategoryIcon(selectedTx.categoryName)
          return (
            <div 
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
            >
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body max-h-[85vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedTx.type === 'income' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-pink-50 text-[var(--color-primary)]'
                    }`}>
                      {selectedTx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </div>
                  <button onClick={() => setSelectedTx(null)} className="text-gray-400 p-1 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Modal Body */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pt-3 pr-1 touch-pan-y overscroll-contain">
                  {/* Amount & Category Hero Card (Render Lucide Icon matching category) */}
                  <div className="text-center py-4 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-white mx-auto flex items-center justify-center text-2xl shadow-xs border border-pink-100 mb-2 text-[var(--color-primary)]">
                      <ModalCatIcon size={26} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 font-body">
                      {selectedTx.type === 'income' ? '+' : '-'}{formatThaiCurrency(selectedTx.amount)}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold">{selectedTx.description || selectedTx.categoryName}</p>
                  </div>

                  {/* Attached Slip Image Preview (Click to open full lightbox modal) */}
                  {(selectedTx.slipUrl || selectedTx.source === 'slip_scan') && (
                    <div className="bg-pink-50/60 rounded-2xl p-3 border border-pink-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center gap-1.5">
                          <Camera size={14} className="text-[var(--color-primary)]" /> รูปภาพสลิปใบเสร็จที่แนบไว้
                        </span>
                        {signedSlipUrl && (
                          <span className="text-[10px] text-pink-600 font-bold bg-white px-2 py-0.5 rounded-full border border-pink-200">
                            จิ้มเพื่อดูรูปเต็ม 🔍
                          </span>
                        )}
                      </div>
                      
                      {isLoadingSignedUrl ? (
                        <div className="w-full h-36 rounded-xl border border-pink-200 bg-white/80 flex items-center justify-center text-xs text-gray-400 font-bold animate-pulse">
                          <Loader2 size={18} className="animate-spin mr-2 text-pink-500" /> กำลังโหลดรูปสลิปปลอดภัย...
                        </div>
                      ) : signedSlipUrl ? (
                        <motion.img 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowFullSlipModal(true)}
                          src={signedSlipUrl} 
                          alt="Receipt Slip" 
                          className="w-full max-h-56 object-contain rounded-xl border border-pink-200 bg-white/80 p-1 shadow-2xs cursor-pointer"
                        />
                      ) : (
                        <div className="w-full p-4 rounded-xl border border-pink-200 bg-white/80 text-center text-xs text-gray-400 font-bold">
                          ไม่พบไฟล์รูปภาพสลิป หรือไฟล์ถูกลบตามโควต้า 30 สลิปย้อนหลัง
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detail Info Grid */}
                  <div className="space-y-2 text-xs font-body">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-500 font-bold">
                        <Tag size={15} className="text-pink-500" /> หมวดหมู่
                      </span>
                      <span className="font-bold text-gray-800">{selectedTx.categoryName}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-500 font-bold">
                        <Wallet size={15} className="text-pink-500" /> กระเป๋าเงิน
                      </span>
                      <span className="font-bold text-gray-800">{selectedTx.accountName || 'เงินสด'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-500 font-bold">
                        <Calendar size={15} className="text-pink-500" /> วันที่และเวลา
                      </span>
                      <span className="font-bold text-gray-800">{selectedTx.date || 'วันนี้'} {selectedTx.time}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-500 font-bold">
                        <FileText size={15} className="text-pink-500" /> วิธีการบันทึก
                      </span>
                      <span className="font-bold text-gray-800">
                        {selectedTx.source === 'slip_scan' ? 'สแกนสลิปใบเสร็จ 📷' : 'คีย์ข้อมูลมือ ✍️'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Edit & Delete */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={openEditModal}
                      className="flex-1 py-3 rounded-2xl border border-pink-200 bg-pink-50 text-[var(--color-primary)] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
                    >
                      <Edit3 size={15} /> แก้ไขรายการ
                    </button>

                    <button
                      onClick={() => handleDelete(selectedTx.id)}
                      className="py-3 px-4 rounded-2xl border border-red-200 bg-red-50 text-red-500 text-xs font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-transform"
                    >
                      <Trash2 size={15} /> ลบ
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      {/* Lightbox Modal: Full Screen Uncropped Slip Image */}
      <AnimatePresence>
        {showFullSlipModal && selectedTx && (
          <div 
            onClick={() => setShowFullSlipModal(false)}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-md w-full max-h-[85vh] flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setShowFullSlipModal(false)}
                className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-md"
              >
                <X size={20} />
              </button>

              <img 
                src={signedSlipUrl || ''}
                alt="Full Slip Preview"
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />
              <p className="text-white/80 text-xs mt-3 font-bold font-body">แตะที่ว่างเพื่อปิด ✕</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {showEditModal && selectedTx && (
          <div 
            onClick={() => setShowEditModal(false)}
            className="fixed inset-0 z-[130] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-pink-100 cursor-default font-body space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b pb-2 shrink-0">
                <h3 className="font-bold text-base text-gray-800 font-body flex items-center gap-2">
                  <Edit3 size={18} className="text-[var(--color-primary)]" /> แก้ไขรายละเอียดรายการ
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 p-1 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 font-body">
                {/* 1. Edit Name / Description */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ชื่อรายการ</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>

                {/* 2. Edit Category Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">หมวดหมู่รายการ</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-pink-100 rounded-2xl bg-pink-50/20 touch-pan-y overscroll-contain">
                    {ALL_CATEGORIES.map(cat => {
                      const isSelected = editCategory.name === cat.name
                      const IconComp = cat.icon
                      return (
                        <button
                          key={cat.name}
                          onClick={() => setEditCategory(cat)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-100 text-[var(--color-primary)] scale-105'
                              : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center mb-1 text-[var(--color-primary)]">
                            <IconComp size={14} />
                          </div>
                          <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Edit Amount */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">จำนวนเงิน (บาท)</label>
                  <input 
                    type="number" 
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body font-mono"
                  />
                </div>

                {/* 4. Edit Date & Time Row */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">วันที่และเวลา</label>
                  <button
                    onClick={() => setShowDatePickerModal(true)}
                    className="w-full p-3 rounded-2xl border border-pink-200 bg-pink-50/40 flex items-center justify-between text-left font-body"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <Calendar size={16} className="text-[var(--color-primary)]" />
                      <span>วันที่: {editDate} ({editTime} น.)</span>
                    </div>
                    <Edit3 size={14} className="text-pink-500" />
                  </button>
                </div>

                {/* 5. Account / Wallet Selector Dropdown */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">กระเป๋าเงินที่ใช้ชำระ</label>
                  <div className="relative font-body">
                    <select
                      value={editAccount?.id}
                      onChange={(e) => {
                        const found = accounts.find(a => a.id === e.target.value)
                        if (found) setEditAccount(found)
                      }}
                      className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 pr-10 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 appearance-none font-body cursor-pointer shadow-2xs"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (฿{acc.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveEdit}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md active:scale-95 transition-transform font-body shrink-0"
              >
                บันทึกการแก้ไข
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date & Time Picker Modal for Edit Form (Image 2 style) */}
      <AnimatePresence>
        {showDatePickerModal && (
          <div 
            onClick={() => setShowDatePickerModal(false)}
            className="fixed inset-0 z-[140] flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 pb-20 cursor-pointer"
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
                  <Calendar size={18} className="text-[var(--color-primary)]" /> ปรับตั้งวันที่และเวลา
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
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">เลือกเวลา</label>
                  <input 
                    type="time" 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-2xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 font-body"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowDatePickerModal(false)}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md active:scale-95 transition-transform font-body"
              >
                ตกลง
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
