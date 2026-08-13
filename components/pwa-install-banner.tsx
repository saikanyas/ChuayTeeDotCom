'use client'

import Image from 'next/image'
import logoImg from '@/app/CatWalletLogo-1024px.png'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, CheckCircle2, Share, MoreVertical, X, ExternalLink, PlusSquare, Smartphone, AlertTriangle } from 'lucide-react'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstructionModal, setShowInstructionModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [inAppName, setInAppName] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Detect standalone installed state
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setIsInstalled(isStandalone)

    // 2. Detect iOS / iPadOS
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(iosDevice)

    // 3. Detect In-App Browsers (LINE, Facebook, Messenger, Instagram, TikTok)
    if (ua.includes('line/')) {
      setIsInAppBrowser(true)
      setInAppName('LINE')
    } else if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab')) {
      setIsInAppBrowser(true)
      setInAppName('Facebook')
    } else if (ua.includes('instagram')) {
      setIsInAppBrowser(true)
      setInAppName('Instagram')
    } else if (ua.includes('tiktok')) {
      setIsInAppBrowser(true)
      setInAppName('TikTok')
    }

    // 4. Capture PWA beforeinstallprompt event (Android / Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      // If native prompt is not available, show step-by-step instruction modal
      setShowInstructionModal(true)
    }
  }

  // State A: Already Installed
  if (isInstalled) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 font-body text-xs shadow-2xs">
        <CheckCircle2 size={22} className="shrink-0 text-emerald-600" />
        <div>
          <p className="font-bold text-sm">ติดตั้งแอปเรียบร้อยแล้ว! 🎉</p>
          <p className="text-[11px] text-emerald-600">คุณสามารถเปิดใช้งาน ช่วยที.com ผ่านไอคอนบนหน้าจอมือถือได้ทันที</p>
        </div>
      </div>
    )
  }

  // State B: Opened via In-App Browser (LINE, Facebook, Instagram)
  if (isInAppBrowser) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 font-body text-xs space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span>เปิดใช้งานผ่านแอป {inAppName}</span>
        </div>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          เบราว์เซอร์ของ {inAppName} ไม่อนุญาตให้ติดตั้งแอปโดยตรง กรุณาแตะจุด 3 จุด <b>(⋮)</b> มุมขวาบน แล้วเลือก <b>"เปิดใน Chrome"</b> หรือ <b>"เปิดด้วย Safari"</b> เพื่อติดตั้งลงมือถือครับ
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-md font-body">
        <div className="flex items-center gap-3">
          <Image 
            src={logoImg} 
            alt="Logo" 
            width={42}
            height={42}
            className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-xs shrink-0 object-cover" 
          />
          <div>
            <p className="font-bold text-sm">ติดตั้งแอป ช่วยที.com</p>
            <p className="text-[11px] opacity-90">ใช้งานเต็มหน้าจอ ลื่นไหล เหมือนแอปจริง</p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="px-3.5 py-2.5 rounded-xl bg-white text-[var(--color-primary)] font-bold text-xs shadow-md hover:bg-pink-50 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Download size={15} /> {deferredPrompt ? 'ติดตั้งแอป' : 'วิธีติดตั้ง'}
        </button>
      </div>

      {/* Instruction Modal (For iOS Safari or Android Chrome without active prompt) */}
      <AnimatePresence>
        {showInstructionModal && (
          <div 
            onClick={() => setShowInstructionModal(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 cursor-pointer font-body"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-pink-100 cursor-default"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                  <Smartphone size={18} className="text-[var(--color-primary)]" />
                  {isIOS ? 'วิธีติดตั้งบน iPhone / iPad (iOS)' : 'วิธีติดตั้งบน Android / มือถือ'}
                </h3>
                <button 
                  onClick={() => setShowInstructionModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>

              {isIOS ? (
                /* iOS Steps */
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-gray-800">แตะปุ่ม "แชร์" (Share)</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">ที่แถบด้านล่างสุดของเบราว์เซอร์ Safari <Share size={13} className="inline text-pink-500" /></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-gray-800">เลือก "เพิ่มไปยังหน้าจอโฮม"</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">เลื่อนเมนูลงมาแล้วกดคำว่า (Add to Home Screen) <PlusSquare size={13} className="inline text-pink-500" /></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-gray-800">กด "เพิ่ม" (Add)</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">กดปุ่มเพิ่มที่มุมขวาบน ไอคอนแอปจะไปอยู่ที่หน้าจอโฮมทันที!</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android Steps */
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-gray-800">แตะจุด 3 จุด (⋮)</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">มุมขวาบนของเบราว์เซอร์ Chrome หรือ Samsung Internet <MoreVertical size={13} className="inline text-pink-500" /></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-gray-800">เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอโฮม"</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">(Install App / Add to Home screen)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-gray-800">กดยืนยันติดตั้ง</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">ไอคอน ช่วยที.com จะปรากฏบนหน้าจอมือถือของคุณทันที</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstructionModal(false)}
                className="w-full py-3 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
              >
                เข้าใจแล้ว 👍
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
