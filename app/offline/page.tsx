'use client'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface-tint)] flex items-center justify-center mb-6">
        <WifiOff size={48} className="text-[var(--color-primary)]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</h1>
      <p className="text-gray-500 mb-8">กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง</p>
      <button className="btn-primary" onClick={() => window.location.reload()}>
        ลองใหม่
      </button>
    </div>
  )
}
