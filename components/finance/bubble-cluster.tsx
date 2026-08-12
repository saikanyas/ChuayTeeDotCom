'use client'

import { motion } from 'framer-motion'
import { getLucideCategoryIcon } from '@/lib/utils'

interface CategorySummary {
  name: string
  icon: string
  amount: number
  color: string
}

interface BubbleClusterProps {
  type: 'expense' | 'income'
  onTypeChange: (type: 'expense' | 'income') => void
  totalAmount: number
  dateTitle: string
  categories?: CategorySummary[]
}

export default function BubbleCluster({
  type,
  onTypeChange,
  totalAmount,
  dateTitle,
  categories = []
}: BubbleClusterProps) {
  // Sort categories by amount descending
  const sortedCategories = [...categories].sort((a, b) => b.amount - a.amount)
  const maxAmount = sortedCategories[0]?.amount || 1

  // Fixed polar angles for dynamic bubbles (radians/degrees)
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]

  return (
    <div className="relative flex flex-col items-center py-6 px-4 font-body">
      {/* Title & Amount header */}
      <motion.div 
        className="text-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <p className="text-sm font-semibold text-gray-600 mb-1">{dateTitle}</p>
        <p 
          className="text-3xl font-display font-bold font-mono-amount"
          style={{ color: type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)' }}
        >
          {totalAmount.toLocaleString()} <span className="text-xl font-normal text-gray-500">บาท</span>
        </p>
      </motion.div>

      {/* Bubble orbit container */}
      <div className="relative w-full max-w-[340px] h-[300px] flex items-center justify-center my-2">
        {/* Orbiting category bubbles — ONLY show if there are actual transactions in the month */}
        {sortedCategories.length > 0 && sortedCategories.map((cat, i) => {
          // Calculate proportional size: max amount gets 76px, minimum 46px
          const ratio = cat.amount / maxAmount
          const sizePx = Math.round(46 + ratio * 30) // 46px to 76px
          
          // Calculate radius & angle position around center
          const angleDeg = angles[i % angles.length]
          const radiusPx = 110 // distance from center
          const angleRad = (angleDeg * Math.PI) / 180
          const leftPercent = 50 + (radiusPx * Math.cos(angleRad)) / 3.4
          const topPercent = 50 + (radiusPx * Math.sin(angleRad)) / 3.0

          const IconComp = getLucideCategoryIcon(cat.name)

          return (
            <motion.div
              key={cat.name + i}
              className="absolute rounded-full bg-white shadow-xs border border-pink-100 flex flex-col items-center justify-center cursor-pointer p-1"
              style={{
                top: `${topPercent}%`,
                left: `${leftPercent}%`,
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                y: ['-50%', '-56%', '-50%'],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
            >
              <div className="text-[var(--color-primary)] mb-0.5">
                <IconComp size={sizePx > 60 ? 20 : 16} strokeWidth={2} />
              </div>
              <span className="text-[9px] font-bold text-gray-700 truncate max-w-[90%]">{cat.name}</span>
              <span className="text-[9px] font-bold font-mono text-[var(--color-primary)]">฿{cat.amount}</span>
            </motion.div>
          )
        })}

        {/* Central main mascot circle */}
        <motion.div 
          className="w-[140px] h-[140px] rounded-full bg-white shadow-md border-2 border-white flex flex-col items-center justify-center text-center p-3 z-10"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div 
            className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mb-1 text-2xl shadow-2xs"
            whileHover={{ rotate: [0, -10, 10, 0] }}
          >
            🐱
          </motion.div>
          {sortedCategories.length === 0 ? (
            <>
              <p className="text-xs font-bold text-gray-700 leading-tight">ไม่พบข้อมูล</p>
              <p className="text-[10px] text-gray-400 mt-0.5">เพิ่มรายรับรายจ่ายเลย</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-medium">ยอดรวม</p>
              <p className="text-base font-bold font-mono text-gray-800">฿{totalAmount.toLocaleString()}</p>
            </>
          )}
        </motion.div>
      </div>

      {/* Sub-segmented toggle: รายจ่าย | รายรับ (Bouncy Spring Switch) */}
      <div className="flex bg-white/90 p-1 rounded-full border border-gray-200 shadow-2xs w-48 mt-2 relative">
        <motion.button
          onClick={() => onTypeChange('expense')}
          whileTap={{ scale: 0.92 }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-colors relative z-10 ${
            type === 'expense' ? 'text-[var(--color-primary)]' : 'text-gray-500'
          }`}
        >
          {type === 'expense' && (
            <motion.div
              layoutId="activeSegment"
              className="absolute inset-0 bg-[#FFF0F5] rounded-full shadow-2xs -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          รายจ่าย
        </motion.button>
        
        <motion.button
          onClick={() => onTypeChange('income')}
          whileTap={{ scale: 0.92 }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-colors relative z-10 ${
            type === 'income' ? 'text-[var(--color-income)]' : 'text-gray-500'
          }`}
        >
          {type === 'income' && (
            <motion.div
              layoutId="activeSegment"
              className="absolute inset-0 bg-[#E8FAF0] rounded-full shadow-2xs -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          รายรับ
        </motion.button>
      </div>
    </div>
  )
}
