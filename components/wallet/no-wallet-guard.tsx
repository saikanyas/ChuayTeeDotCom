'use client'

import { useFinanceStore } from '@/store/finance'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

export default function NoWalletGuard() {
  const { accounts } = useFinanceStore()
  const router = useRouter()
  const pathname = usePathname()

  // Do not block if user already has wallets OR is currently on the /wallet page
  if (accounts.length > 0 || pathname === '/wallet') {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-body">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-pink-100 font-body"
        >
          <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[var(--color-primary)] flex items-center justify-center mx-auto text-3xl shadow-xs animate-bounce">
            👛
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-800 font-body">ยังไม่มีกระเป๋าเงิน!</h3>
            <p className="text-xs text-gray-500 font-body leading-relaxed">
              กรุณาเพิ่มกระเป๋าเงินอย่างน้อย 1 ใบ ก่อนเริ่มบันทึกรายรับ-รายจ่ายนะ 💰
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push('/wallet')}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform font-body"
          >
            <Plus size={18} strokeWidth={2.5} /> เพิ่มกระเป๋าเงินตอนนี้
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
