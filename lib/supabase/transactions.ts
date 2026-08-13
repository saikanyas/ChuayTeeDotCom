import { createClient } from '@/lib/supabase/client'
import type { Transaction } from '@/store/finance'

function supabase() {
  return createClient()
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await (supabase().from('transactions') as any)
    .select(`
      id,
      amount,
      type,
      description,
      transaction_date,
      transaction_time,
      source,
      account_id,
      accounts(name),
      categories(name, icon, color),
      slips(storage_path)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((t: any) => {
    const catName = t.categories?.name || t.description || (t.type === 'income' ? 'รายรับ' : 'ทั่วไป')
    return {
      id: t.id,
      categoryName: catName,
      categoryIcon: t.categories?.icon ?? catName,
      categoryColor: t.categories?.color ?? (t.type === 'income' ? '#34C759' : '#FF3478'),
      description: t.description ?? catName,
      time: t.transaction_time ? String(t.transaction_time).slice(0, 5) : '00:00',
      date: t.transaction_date ?? new Date().toISOString().split('T')[0],
      source: (t.source ?? 'manual') as 'manual' | 'slip_scan',
      amount: Number(t.amount),
      type: t.type as 'income' | 'expense',
      accountId: t.account_id ?? undefined,
      accountName: t.accounts?.name ?? undefined,
      slipUrl: t.slips?.storage_path ?? undefined,
    }
  })
}

export async function createTransaction(
  userId: string,
  data: {
    account_id: string
    type: 'income' | 'expense'
    amount: number
    description: string
    transaction_date: string
    transaction_time: string
    source: 'manual' | 'slip_scan'
    category_id?: string
  }
): Promise<string> {
  const { data: row, error } = await (supabase().from('transactions') as any)
    .insert({ user_id: userId, ...data })
    .select('id')
    .single()

  if (error || !row) throw error || new Error('No row returned')
  return row.id
}

export async function updateTransaction(
  id: string,
  data: Partial<{
    description: string
    amount: number
    transaction_date: string
    transaction_time: string
    account_id: string
    category_id: string
  }>
): Promise<void> {
  const { error } = await (supabase().from('transactions') as any)
    .update(data)
    .eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await (supabase().from('transactions') as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}
