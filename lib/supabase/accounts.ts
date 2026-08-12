import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/store/finance'

function supabase() {
  return createClient()
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await (supabase().from('accounts') as any)
    .select('id, name, type, balance, icon, color')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: (r.type ?? 'cash') as 'cash' | 'bank' | 'wallet',
    balance: Number(r.balance),
    icon: r.icon ?? '💵',
    color: r.color ?? '#FF3478',
  }))
}

export async function createAccount(
  userId: string,
  data: { name: string; type: string; balance: number; icon: string; color: string }
): Promise<Account> {
  const { data: row, error } = await (supabase().from('accounts') as any)
    .insert({ user_id: userId, ...data })
    .select('id, name, type, balance, icon, color')
    .single()

  if (error || !row) throw error || new Error('No row returned')
  return {
    id: row.id,
    name: row.name,
    type: (row.type ?? 'cash') as 'cash' | 'bank' | 'wallet',
    balance: Number(row.balance),
    icon: row.icon ?? '💵',
    color: row.color ?? '#FF3478',
  }
}

export async function updateAccount(
  id: string,
  data: Partial<{ name: string; type: string; balance: number; icon: string; color: string }>
): Promise<void> {
  const { error } = await (supabase().from('accounts') as any)
    .update(data)
    .eq('id', id)
  if (error) throw error
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await (supabase().from('accounts') as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}
