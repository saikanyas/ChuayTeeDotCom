'use client'

import { useEffect } from 'react'

export default function OCRWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const attempted = sessionStorage.getItem('ocr_warmup_attempted')
    if (!attempted) {
      sessionStorage.setItem('ocr_warmup_attempted', 'true')
      const ocrUrl = process.env.NEXT_PUBLIC_OCR_SERVICE_URL || 'https://chuaytee-ocr.onrender.com'
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      fetch(`${ocrUrl}/health`, { 
        method: 'GET', 
        mode: 'cors',
        signal: controller.signal 
      })
        .catch(() => {
          // Non-blocking: warm-up failure or timeout never affects the UI
        })
        .finally(() => {
          clearTimeout(timeoutId)
        })
    }
  }, [])

  return null
}
