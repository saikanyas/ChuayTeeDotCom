'use client'

import { useState } from 'react'
import SlipDock from '@/components/slip/slip-dock'
import { scanSlip, OCRResult } from '@/lib/ocr-client'

export default function ScanPage() {
  const [status, setStatus] = useState<'idle'|'scanning'|'done'|'error'>('idle')
  const [result, setResult] = useState<OCRResult | null>(null)

  const handleFile = async (file: File) => {
    setStatus('scanning')
    try {
      // Mock call for now since service might not be up
      // const res = await scanSlip(file)
      await new Promise(r => setTimeout(r, 2000))
      const res: OCRResult = { bank_name: 'KBank', amount: 150, sender_name: 'John', receiver_name: 'Shop', reference_number: '123', transaction_date: '2026-08-12', transaction_time: '12:00', confidence: 0.9, raw_text: '' }
      setResult(res)
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="min-h-full p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8 mt-4" style={{ color: 'var(--color-text-primary)' }}>สแกนสลิปโอนเงิน</h1>
      
      <div className="w-full max-w-sm">
        <SlipDock onFile={handleFile} status={status} />
        
        {status === 'done' && result && (
          <div className="mt-8 bg-white p-4 rounded-xl border">
            <h3 className="font-bold mb-4">ข้อมูลจากสลิป</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">ยอดเงิน</span><span className="font-bold text-red-500">{result.amount} บาท</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ผู้รับโอน</span><span>{result.receiver_name}</span></div>
            </div>
            <button className="btn-primary w-full mt-6" onClick={() => setStatus('idle')}>บันทึกรายการนี้</button>
          </div>
        )}
      </div>
    </div>
  )
}
