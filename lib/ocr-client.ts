const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL ?? 'http://localhost:8000'
const OCR_TIMEOUT_MS = 90_000

export class OCRServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OCRServiceUnavailableError'
  }
}

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
  const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS)

  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${OCR_URL}/ocr/process`, {
      method: 'POST',
      body: form,
      signal: controller.signal
    })
    if (!res.ok) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new OCRServiceUnavailableError(`OCR service unavailable (${res.status})`)
      }
      throw new Error(`OCR failed: ${res.statusText}`)
    }

    const response = await res.json() as { data: OCRResult }
    return response.data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('OCR ใช้เวลานานเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง')
    }
    if (err instanceof TypeError) {
      throw new OCRServiceUnavailableError('ไม่สามารถเชื่อมต่อ OCR service ได้')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
