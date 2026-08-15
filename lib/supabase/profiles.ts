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
 * Returns the final avatar URL (storage public URL or compressed data URL fallback).
 * If anything fails, it throws an error so the caller can safely keep the previous avatar fallback.
 */
export async function uploadUserAvatar(userId: string, imageBlob: Blob): Promise<string> {
  const storagePath = `${userId}/avatar.jpg`
  let uploadedUrl: string | null = null

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
        uploadedUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`
      }
    }
  } catch (storageErr) {
    console.warn('Storage avatars upload warning (falling back to DataURL/direct):', storageErr)
  }

  // 2. Fallback to compact DataURL if storage bucket is not available or blocked by policy
  if (!uploadedUrl) {
    uploadedUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('ไม่สามารถแปลงรูปภาพสำรองได้'))
      reader.readAsDataURL(imageBlob)
    })
  }

  // 3. Update Supabase Auth user_metadata
  const { error: authErr } = await supabase().auth.updateUser({
    data: {
      avatar_url: uploadedUrl,
      picture: uploadedUrl,
    },
  })
  if (authErr) {
    console.error('updateUser auth metadata failed:', authErr)
    throw new Error('บันทึกข้อมูลภาพโปรไฟล์ไม่สำเร็จ: ' + authErr.message)
  }

  // 4. Update Supabase profiles table (strictly 1 row per user)
  const { error: profileErr } = await (supabase().from('profiles') as any).upsert({
    id: userId,
    avatar_url: uploadedUrl,
    default_currency: 'THB',
  })
  if (profileErr) {
    console.error('upsert profile table failed:', profileErr)
  }

  return uploadedUrl
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
