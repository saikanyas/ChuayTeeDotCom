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
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${OCR_URL}/ocr/process`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`OCR failed: ${res.statusText}`)
  return res.json()
}
