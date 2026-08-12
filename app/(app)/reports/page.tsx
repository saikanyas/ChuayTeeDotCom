'use client'

import { formatThaiCurrency } from '@/lib/utils'

export default function ReportsPage() {
  return (
    <div className="min-h-full p-4">
      <h1 className="text-2xl font-bold mb-6 mt-4 text-gray-800">รายงานสรุป</h1>
      
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg w-max">
        <button className="px-4 py-1.5 bg-white shadow-sm rounded-md text-sm font-bold text-[var(--color-primary)]">สัปดาห์นี้</button>
        <button className="px-4 py-1.5 text-sm font-medium text-gray-500">เดือนนี้</button>
        <button className="px-4 py-1.5 text-sm font-medium text-gray-500">3 เดือน</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-red-50 p-4 rounded-2xl">
          <p className="text-xs text-red-600 mb-1">รายจ่ายรวม</p>
          <p className="text-xl font-bold text-red-600">฿3,450</p>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl">
          <p className="text-xs text-green-600 mb-1">รายรับรวม</p>
          <p className="text-xl font-bold text-green-600">฿8,000</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border mb-6 h-64 flex items-center justify-center">
        <p className="text-gray-400 text-sm">กราฟแท่งรายจ่าย (รอใส่ Recharts)</p>
      </div>
      
      <div className="bg-white p-4 rounded-2xl border h-64 flex items-center justify-center">
        <p className="text-gray-400 text-sm">กราฟวงกลมหมวดหมู่ (รอใส่ Recharts)</p>
      </div>
    </div>
  )
}
