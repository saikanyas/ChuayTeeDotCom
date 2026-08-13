import { createClient } from '@/lib/supabase/client'

function supabase() {
  return createClient()
}

export interface UploadSlipResult {
  storagePath: string
}

/**
 * 1. Upload compressed blob to private Storage bucket: slips/{userId}/{uuid}.jpg
 */
export async function uploadSlip(userId: string, compressedBlob: Blob): Promise<UploadSlipResult> {
  const fileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
  const storagePath = `${userId}/${fileId}.jpg`

  const { error } = await supabase()
    .storage
    .from('slips')
    .upload(storagePath, compressedBlob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    console.error('Storage upload failed:', error)
    throw new Error('อัปโหลดไฟล์สลิปไม่สำเร็จ: ' + error.message)
  }

  return { storagePath }
}

/**
 * 2. Create DB record in `slips` table after Storage upload succeeds
 */
export async function createSlipRecord(
  userId: string,
  storagePath: string,
  ocrData?: {
    detected_bank?: string | null
    extracted_amount?: number | null
    extracted_date?: string | null
    extracted_time?: string | null
    reference_number?: string | null
    sender_name?: string | null
    receiver_name?: string | null
    confidence?: number | null
    raw_text?: string | null
  }
): Promise<string> {
  const { data: row, error } = await (supabase().from('slips') as any)
    .insert({
      user_id: userId,
      storage_path: storagePath,
      detected_bank: ocrData?.detected_bank ?? null,
      extracted_amount: ocrData?.extracted_amount ?? null,
      extracted_date: ocrData?.extracted_date ?? null,
      extracted_time: ocrData?.extracted_time ?? null,
      reference_number: ocrData?.reference_number ?? null,
      sender_name: ocrData?.sender_name ?? null,
      receiver_name: ocrData?.receiver_name ?? null,
      confidence: ocrData?.confidence ?? null,
      ocr_raw_text: ocrData?.raw_text ?? null,
      processing_status: 'completed',
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('DB insert slip failed:', error)
    // Fail-safe cleanup: attempt to delete the uploaded storage file
    await deleteStorageFile(storagePath).catch((err) =>
      console.error('Failed to cleanup orphaned storage file:', err)
    )
    throw error || new Error('ไม่สามารถบันทึกข้อมูลสลิปในระบบได้')
  }

  return row.id
}

/**
 * 3. Enforce 30-slip FIFO cap server-side via RPC `enforce_my_slip_cap`
 */
export async function enforceSlipCap(maxSlips = 30): Promise<void> {
  try {
    // Retry any leftover storage file deletions from previous failed attempts
    await retryPendingStorageDeletions()

    const { data: excessRows, error } = await (supabase() as any).rpc('enforce_my_slip_cap', {
      p_max_slips: maxSlips,
    })

    if (error) {
      console.error('enforce_my_slip_cap RPC error:', error)
      return
    }

    if (excessRows && Array.isArray(excessRows) && excessRows.length > 0) {
      const pathsToDelete = excessRows
        .map((r: any) => r.deleted_storage_path)
        .filter(Boolean)

      if (pathsToDelete.length > 0) {
        const { error: removeError } = await supabase()
          .storage
          .from('slips')
          .remove(pathsToDelete)

        if (removeError) {
          console.error('Failed to remove excess storage files:', removeError, pathsToDelete)
          // Store failed paths in localStorage for automatic retry on next operation
          try {
            if (typeof window !== 'undefined') {
              const existing = JSON.parse(localStorage.getItem('pending_slip_deletions') || '[]')
              const merged = Array.from(new Set([...existing, ...pathsToDelete]))
              localStorage.setItem('pending_slip_deletions', JSON.stringify(merged))
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('enforceSlipCap exception:', err)
  }
}

/**
 * Retry queued un-deleted storage files from previous FIFO cleanups
 */
export async function retryPendingStorageDeletions(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('pending_slip_deletions')
    if (!raw) return
    const pendingPaths: string[] = JSON.parse(raw)
    if (Array.isArray(pendingPaths) && pendingPaths.length > 0) {
      const { error } = await supabase().storage.from('slips').remove(pendingPaths)
      if (!error) {
        localStorage.removeItem('pending_slip_deletions')
      }
    }
  } catch (err) {
    console.error('retryPendingStorageDeletions error:', err)
  }
}

/**
 * 4. Generate short-lived signed URL (1 hour expiry) for a private storage path
 */
export async function getSignedSlipUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  if (!storagePath) return null

  // Handle cases where full URL was saved accidentally
  if (storagePath.startsWith('http')) return storagePath

  try {
    const { data, error } = await supabase()
      .storage
      .from('slips')
      .createSignedUrl(storagePath, expiresIn)

    if (error || !data?.signedUrl) {
      console.error('createSignedUrl error:', error)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('getSignedSlipUrl exception:', err)
    return null
  }
}

/**
 * Fail-safe orphan storage file cleanup helper
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  if (!storagePath) return
  await supabase().storage.from('slips').remove([storagePath])
}
