import useSWR, { KeyedMutator } from 'swr'
import { getTransactions } from '@/lib/supabase/transactions'
import type { Transaction } from '@/store/finance'

export interface UseTransactionsReturn {
  transactions: Transaction[]
  isLoading: boolean
  error: any
  mutate: KeyedMutator<Transaction[]>
}

export function useTransactions(userId?: string | null): UseTransactionsReturn {
  const key = userId ? ['transactions', userId] : null

  const { data, error, isLoading, mutate } = useSWR<Transaction[]>(
    key,
    () => getTransactions(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    transactions: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
