import useSWR, { KeyedMutator } from 'swr'
import { getGoals } from '@/lib/supabase/goals'
import type { Goal } from '@/store/finance'

export interface UseGoalsReturn {
  goals: Goal[]
  isLoading: boolean
  error: any
  mutate: KeyedMutator<Goal[]>
}

export function useGoals(userId?: string | null): UseGoalsReturn {
  const key = userId ? ['goals', userId] : null

  const { data, error, isLoading, mutate } = useSWR<Goal[]>(
    key,
    () => getGoals(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    goals: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
