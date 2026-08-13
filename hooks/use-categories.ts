import useSWR, { KeyedMutator } from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/store/finance'

export interface UseCategoriesReturn {
  categories: Category[]
  isLoading: boolean
  error: any
  mutate: KeyedMutator<Category[]>
}

async function fetchCategories(userId: string): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await (supabase.from('categories') as any)
    .select('id, name, icon, color')
    .or(`user_id.eq.${userId},is_default.eq.true`)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    icon: c.icon ?? '📁',
    color: c.color ?? '#FF3478',
  }))
}

export function useCategories(userId?: string | null): UseCategoriesReturn {
  const key = userId ? ['categories', userId] : null

  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    key,
    () => fetchCategories(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    categories: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
