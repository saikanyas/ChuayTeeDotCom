'use client'

import { useEffect, useState } from 'react'
import { Download, CheckCircle2, Share } from 'lucide-react'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true)
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 font-body text-xs">
        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
        <div>
          <p className="font-bold">ติดตั้งแอปเรียบร้อยแล้ว!</p>
          <p className="text-[11px] text-emerald-600">คุณสามารถใช้งานช่วยที.com ผ่านหน้าจอมือถือได้เต็มรูปแบบ</p>
        </div>
      </div>
    )
  }

  if (isIOS) {
    return (
      <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 text-gray-800 font-body text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-[var(--color-primary)]">
          <Share size={16} /> วิธีติดตั้งแอปบน iPhone / iPad (iOS):
        </div>
        <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px]">
          <li>แตะปุ่ม <b>แชร์ (Share)</b> <Share size={12} className="inline mx-0.5" /> ที่แถบล่างสุดของ Safari</li>
          <li>เลื่อนลงมาแล้วเลือก <b>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</b> ➕</li>
          <li>กด <b>เพิ่ม (Add)</b> ที่มุมขวาบนเพื่อใช้งานเป็นแอปได้ทันที!</li>
        </ol>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-md font-body">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-xs shrink-0 object-cover" />
        <div>
          <p className="font-bold text-sm">ติดตั้งแอป ช่วยที.com</p>
          <p className="text-[11px] opacity-90">ใช้งานลื่นไหล เปิดได้จากหน้าจอมือถือ</p>
        </div>
      </div>
      <button
        onClick={handleInstallClick}
        disabled={!deferredPrompt}
        className="px-3.5 py-2 rounded-xl bg-white text-[var(--color-primary)] font-bold text-xs shadow-xs hover:bg-pink-50 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60"
      >
        <Download size={14} /> {deferredPrompt ? 'ติดตั้งแอป' : 'พร้อมติดตั้ง'}
      </button>
    </div>
  )
}
