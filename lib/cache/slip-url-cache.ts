import { getSignedSlipUrl } from '@/lib/supabase/slips'

type CachedSlipUrl = {
  url: string
  expiresAt: number
}

// In-memory cache map for private slip signed URLs
const slipUrlCache = new Map<string, CachedSlipUrl>()

/**
 * In-memory cache for private slip signed URLs.
 * Default signed URL lifetime is 10 minutes (600 seconds).
 * Reuses cached URLs until 60 seconds before expiration.
 * Stored in memory only (cleared when session ends).
 */
export async function getCachedSignedSlipUrl(
  storagePath: string,
  expiresInSeconds = 600
): Promise<string | null> {
  if (!storagePath) return null

  // If already a full http URL, return directly
  if (storagePath.startsWith('http')) return storagePath

  const now = Date.now()
  const cached = slipUrlCache.get(storagePath)

  // Safety buffer: reuse until 60 seconds before expiry
  if (cached && cached.expiresAt - now > 60_000) {
    return cached.url
  }

  // Generate new signed URL
  const signedUrl = await getSignedSlipUrl(storagePath, expiresInSeconds)
  if (signedUrl) {
    slipUrlCache.set(storagePath, {
      url: signedUrl,
      expiresAt: now + expiresInSeconds * 1000,
    })
  }

  return signedUrl
}

/**
 * Clear or invalidate cached signed URL for a specific storage path
 */
export function invalidateSlipUrlCache(storagePath?: string): void {
  if (storagePath) {
    slipUrlCache.delete(storagePath)
  } else {
    slipUrlCache.clear()
  }
}
