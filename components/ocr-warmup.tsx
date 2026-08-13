'use client'

import { useEffect } from 'react'

export default function OCRWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const attempted = sessionStorage.getItem('ocr_warmup_attempted')
    if (!attempted) {
      sessionStorage.setItem('ocr_warmup_attempted', 'true')
      const ocrUrl = process.env.NEXT_PUBLIC_OCR_SERVICE_URL || 'https://chuaytee-ocr.onrender.com'
      fetch(`${ocrUrl}/health`, { method: 'GET', mode: 'cors' }).catch(() => {
        // Non-blocking: warm-up failure never affects the UI
      })
    }
  }, [])

  return null
}
