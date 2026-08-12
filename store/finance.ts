import { create } from 'zustand'

export interface Transaction {
  id: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  description: string
  time: string
  source: 'manual' | 'slip_scan'
  amount: number
  type: 'income' | 'expense'
  note?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Account {
  id: string
  name: string
  balance: number
}

interface FinanceStore {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  isLoading: boolean
  setTransactions: (t: Transaction[]) => void
  setCategories: (c: Category[]) => void
  setAccounts: (a: Account[]) => void
  setLoading: (b: boolean) => void
  addTransaction: (t: Transaction) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  categories: [],
  accounts: [],
  isLoading: false,
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  setAccounts: (accounts) => set({ accounts }),
  setLoading: (isLoading) => set({ isLoading }),
  addTransaction: (t) => set((state) => ({ transactions: [t, ...state.transactions] }))
}))
