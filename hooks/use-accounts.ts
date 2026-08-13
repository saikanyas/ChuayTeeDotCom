import useSWR, { KeyedMutator } from 'swr'
import { getAccounts } from '@/lib/supabase/accounts'
import type { Account } from '@/store/finance'

export interface UseAccountsReturn {
  accounts: Account[]
  isLoading: boolean
  error: any
  mutate: KeyedMutator<Account[]>
}

export function useAccounts(userId?: string | null): UseAccountsReturn {
  const key = userId ? ['accounts', userId] : null

  const { data, error, isLoading, mutate } = useSWR<Account[]>(
    key,
    () => getAccounts(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    accounts: data ?? [],
    isLoading,
    error,
    mutate,
  }
}
