'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, Plus, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { name: 'หน้าหลัก', href: '/', icon: Home },
    { name: 'สแกนสลิป', href: '/scan', icon: Camera },
    { name: 'รายงาน', href: '/reports', icon: BarChart3 },
    { name: 'ตั้งค่า', href: '/settings', icon: Settings },
  ]

  return (
    <div className="bottom-nav fixed bottom-0 w-full max-w-[430px] h-[80px] bg-white border-t flex justify-around items-center px-2 z-50" style={{ borderColor: 'var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.slice(0, 2).map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link key={tab.name} href={tab.href} className={cn("nav-tab flex flex-col items-center justify-center w-16 space-y-1", isActive && "active")} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
            <tab.icon size={24} />
            <span className="text-[10px] font-body">{tab.name}</span>
          </Link>
        )
      })}

      <div className="relative -top-5 flex justify-center w-16">
        <Link href="/add" className="fab w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-pulse-pink" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          <Plus size={32} />
        </Link>
      </div>

      {tabs.slice(2).map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link key={tab.name} href={tab.href} className={cn("nav-tab flex flex-col items-center justify-center w-16 space-y-1", isActive && "active")} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
            <tab.icon size={24} />
            <span className="text-[10px] font-body">{tab.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
