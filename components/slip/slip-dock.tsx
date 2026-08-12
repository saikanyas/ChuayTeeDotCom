'use client'

import { useRef, useState } from 'react'
import { Camera, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onFile: (file: File) => void
  status: 'idle' | 'scanning' | 'done' | 'error'
}

export default function SlipDock({ onFile, status }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true)
    else if (e.type === 'dragleave') setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.size <= 10 * 1024 * 1024) onFile(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size <= 10 * 1024 * 1024) onFile(file)
    }
  }

  return (
    <div 
      className={cn("slip-dock relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 min-h-[300px] transition-all cursor-pointer overflow-hidden bg-white", isDragging ? "border-[var(--color-primary)] bg-[var(--color-surface-tint)]" : "border-gray-300", status === 'scanning' && "opacity-80")}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => status !== 'scanning' && inputRef.current?.click()}
    >
      <input type="file" ref={inputRef} onChange={handleChange} accept="image/*" className="hidden" />

      {status === 'idle' && (
        <>
          <Camera size={48} style={{ color: 'var(--color-primary)' }} className="mb-4" />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>วางสลิปโอนเงินที่นี่</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>หรือแตะเพื่อเลือกรูปถ่าย</p>
        </>
      )}

      {status === 'scanning' && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] scan-line animate-[scan_2s_ease-in-out_infinite]" />
          <Camera size={48} style={{ color: 'var(--color-primary)' }} className="mb-4 animate-pulse" />
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>กำลังอ่านข้อมูลสลิป...</h3>
        </>
      )}

      {status === 'done' && (
        <>
          <CheckCircle2 size={48} className="text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-green-600">อ่านสลิปสำเร็จ!</h3>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-600 text-center">อ่านยอดเงินจากสลิปไม่ได้<br/>กรุณาขยับมุมกล้องแล้วลองอีกครั้ง</h3>
        </>
      )}
    </div>
  )
}
