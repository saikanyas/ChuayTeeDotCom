'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect old scan route directly to /add transaction page
    router.replace('/add')
  }, [router])

  return (
    <div className="min-h-screen bg-[#FFF5F8] flex items-center justify-center p-4 font-body text-gray-500">
      <p className="text-xs font-bold animate-pulse">กำลังไปยังหน้าเพิ่มธุรกรรมสแกนสลิป...</p>
    </div>
  )
}
