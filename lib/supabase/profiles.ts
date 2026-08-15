import { createClient } from '@/lib/supabase/client'

function supabase() {
  return createClient()
}

export interface ProfileData {
  id: string
  display_name: string | null
  avatar_url: string | null
  default_currency: string
  created_at?: string
}

/**
 * Get profile data from Supabase profiles table
 */
export async function getProfile(userId: string): Promise<ProfileData | null> {
  try {
    const { data, error } = await (supabase().from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('getProfile error:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('getProfile exception:', err)
    return null
  }
}

/**
 * Upload & update avatar for a user (strictly 1 file per account).
 * CRITICAL FIX: NEVER save base64 DataURLs into Supabase Auth user_metadata,
 * as Auth user_metadata is serialized directly into the JWT cookie and causes
 * Vercel HTTP 494 REQUEST_HEADER_TOO_LARGE errors!
 */
export async function uploadUserAvatar(userId: string, imageBlob: Blob): Promise<string> {
  const storagePath = `${userId}/avatar.jpg`
  let storagePublicUrl: string | null = null

  // 1. Try uploading to 'avatars' storage bucket with upsert: true (replaces existing single avatar)
  try {
    const { error: uploadErr } = await supabase()
      .storage
      .from('avatars')
      .upload(storagePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (!uploadErr) {
      const { data: publicUrlData } = supabase().storage.from('avatars').getPublicUrl(storagePath)
      if (publicUrlData?.publicUrl) {
        storagePublicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`
      }
    } else {
      console.warn('Storage upload notice:', uploadErr.message)
    }
  } catch (storageErr) {
    console.warn('Storage avatars upload warning:', storageErr)
  }

  // 2. If storage upload succeeded, we have a lightweight HTTP URL (~80 bytes)
  if (storagePublicUrl) {
    // Safe to update Supabase Auth user_metadata with short HTTP URL
    await supabase().auth.updateUser({
      data: {
        avatar_url: storagePublicUrl,
        picture: storagePublicUrl,
      },
    })

    // Update Supabase profiles table (strictly 1 row per user)
    await (supabase().from('profiles') as any).upsert({
      id: userId,
      avatar_url: storagePublicUrl,
      default_currency: 'THB',
    })

    return storagePublicUrl
  }

  // 3. Fallback: If storage bucket isn't available, save compact DataURL ONLY in PostgreSQL profiles table!
  // DO NOT pass DataURL to supabase.auth.updateUser to avoid cookie header explosion!
  const base64DataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ไม่สามารถแปลงรูปภาพสำรองได้'))
    reader.readAsDataURL(imageBlob)
  })

  // Save base64 ONLY in the PostgreSQL profiles table
  const { error: profileErr } = await (supabase().from('profiles') as any).upsert({
    id: userId,
    avatar_url: base64DataUrl,
    default_currency: 'THB',
  })
  if (profileErr) {
    console.error('upsert profile table failed:', profileErr)
    throw new Error('บันทึกรูปโปรไฟล์ไม่สำเร็จ: ' + profileErr.message)
  }

  return base64DataUrl
}

/**
 * Update display name in Supabase Auth & profiles table
 */
export async function updateProfileDisplayName(userId: string, displayName: string): Promise<void> {
  const { error: authErr } = await supabase().auth.updateUser({
    data: {
      full_name: displayName.trim(),
      display_name: displayName.trim(),
    },
  })
  if (authErr) throw authErr

  await (supabase().from('profiles') as any).upsert({
    id: userId,
    display_name: displayName.trim(),
    default_currency: 'THB',
  })
}
