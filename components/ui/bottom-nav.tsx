'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PieChart, ClipboardList, Plus, Wallet, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()

  const tabsLeft = [
    { name: 'ภาพรวม', href: '/', icon: PieChart },
    { name: 'ธุรกรรม', href: '/transactions', icon: ClipboardList },
  ]

  const tabsRight = [
    { name: 'กระเป๋า', href: '/wallet', icon: Wallet },
    { name: 'เมนู', href: '/settings', icon: LayoutGrid },
  ]

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-[410px] h-[72px] bg-white/95 backdrop-blur-md rounded-full border border-gray-100 shadow-xl flex justify-between items-center px-4 z-50">
      {tabsLeft.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <motion.div key={tab.name} whileTap={{ scale: 0.82 }}>
            <Link 
              href={tab.href} 
              className={cn("flex flex-col items-center justify-center w-14 transition-colors", isActive ? "text-[var(--color-primary)] font-bold" : "text-gray-400")}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] mt-1 font-body">{tab.name}</span>
              {isActive && (
                <motion.span 
                  layoutId="activeBottomDot" 
                  className="w-4 h-[2px] bg-[var(--color-primary)] rounded-full mt-[2px]" 
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          </motion.div>
        )
      })}

      <motion.div 
        className="relative flex justify-center items-center"
        whileTap={{ scale: 0.85, rotate: 90 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <Link 
          href="/add" 
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform" 
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={30} strokeWidth={2.8} />
        </Link>
      </motion.div>

      {tabsRight.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <motion.div key={tab.name} whileTap={{ scale: 0.82 }}>
            <Link 
              href={tab.href} 
              className={cn("flex flex-col items-center justify-center w-14 transition-colors", isActive ? "text-[var(--color-primary)] font-bold" : "text-gray-400")}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] mt-1 font-body">{tab.name}</span>
              {isActive && (
                <motion.span 
                  layoutId="activeBottomDot" 
                  className="w-4 h-[2px] bg-[var(--color-primary)] rounded-full mt-[2px]" 
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
