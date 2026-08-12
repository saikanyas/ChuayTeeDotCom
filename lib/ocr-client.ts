const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL ?? 'http://localhost:8000'

export interface OCRResult {
  bank_name: string | null
  amount: number | null
  sender_name: string | null
  receiver_name: string | null
  reference_number: string | null
  transaction_date: string | null
  transaction_time: string | null
  confidence: number
  raw_text: string
}

export async function scanSlip(file: File): Promise<OCRResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout for connection check

  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${OCR_URL}/ocr/process`, { 
      method: 'POST', 
      body: form,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`OCR failed: ${res.statusText}`)
    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}
