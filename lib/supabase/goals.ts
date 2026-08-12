import { createClient } from '@/lib/supabase/client'
import type { Goal } from '@/store/finance'

function supabase() {
  return createClient()
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await (supabase().from('goals') as any)
    .select('id, title, description, target_amount, current_amount, color')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    target: Number(r.target_amount),
    current: Number(r.current_amount),
    color: r.color ?? '#FF3478',
  }))
}

export async function createGoal(
  userId: string,
  data: { title: string; description: string; target_amount: number; current_amount: number; color: string }
): Promise<Goal> {
  const { data: row, error } = await (supabase().from('goals') as any)
    .insert({ user_id: userId, ...data })
    .select('id, title, description, target_amount, current_amount, color')
    .single()

  if (error || !row) throw error || new Error('No row returned')
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    target: Number(row.target_amount),
    current: Number(row.current_amount),
    color: row.color ?? '#FF3478',
  }
}

export async function updateGoal(
  id: string,
  data: Partial<{ title: string; description: string; target_amount: number; current_amount: number; color: string }>
): Promise<void> {
  const { error } = await (supabase().from('goals') as any)
    .update(data)
    .eq('id', id)
  if (error) throw error
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await (supabase().from('goals') as any)
    .delete()
    .eq('id', id)
  if (error) throw error
}
