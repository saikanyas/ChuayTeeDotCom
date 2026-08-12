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
  date?: string
  accountId?: string
  accountName?: string
  slipUrl?: string
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
  type: 'cash' | 'bank' | 'wallet'
  balance: number
  icon: string
  color: string
}

export interface Goal {
  id: string
  title: string
  description: string
  current: number
  target: number
  color?: string
}

interface FinanceStore {
  // Data (cache from Supabase — do NOT mutate balance locally)
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  goals: Goal[]

  // UI state
  selectedAccount: Account | null
  isLoading: boolean
  dailyTarget: number
  pendingScanFile: File | null

  // Setters (bulk sync from Supabase)
  setTransactions: (t: Transaction[]) => void
  setCategories: (c: Category[]) => void
  setAccounts: (a: Account[]) => void
  setGoals: (g: Goal[]) => void
  setSelectedAccount: (acc: Account | null) => void
  setLoading: (b: boolean) => void
  setDailyTarget: (n: number) => void
  setPendingScanFile: (f: File | null) => void

  // Local optimistic updaters (UI only — real source of truth is Supabase)
  addTransaction: (t: Transaction) => void
  removeTransaction: (id: string) => void
  updateTransactionLocal: (id: string, data: Partial<Transaction>) => void

  addAccount: (acc: Account) => void
  removeAccount: (id: string) => void
  updateAccountLocal: (id: string, data: Partial<Account>) => void

  addGoal: (g: Goal) => void
  removeGoal: (id: string) => void
  updateGoal: (id: string, data: Partial<Goal>) => void

  // Legacy aliases (backward compat with existing page code)
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  updateAccount: (id: string, data: Partial<Account>) => void
  deleteAccount: (id: string) => void
  deleteGoal: (id: string) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  categories: [],
  accounts: [],
  goals: [],
  selectedAccount: null,
  isLoading: false,
  dailyTarget: 300,
  pendingScanFile: null,

  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  setAccounts: (accounts) => set((state) => ({
    accounts,
    selectedAccount: state.selectedAccount
      ? (accounts.find(a => a.id === state.selectedAccount!.id) ?? accounts[0] ?? null)
      : (accounts[0] ?? null),
  })),
  setGoals: (goals) => set({ goals }),
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),
  setLoading: (isLoading) => set({ isLoading }),
  setDailyTarget: (dailyTarget) => set({ dailyTarget }),
  setPendingScanFile: (pendingScanFile) => set({ pendingScanFile }),

  // Transactions — NO balance mutation (DB triggers handle it)
  addTransaction: (t) => set((state) => ({
    transactions: [t, ...state.transactions],
  })),
  removeTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id),
  })),
  updateTransactionLocal: (id, data) => set((state) => ({
    transactions: state.transactions.map(t => t.id === id ? { ...t, ...data } : t),
  })),

  // Accounts — local cache update only
  addAccount: (acc) => set((state) => ({
    accounts: [...state.accounts, acc],
    selectedAccount: state.selectedAccount ?? acc,
  })),
  removeAccount: (id) => set((state) => {
    const next = state.accounts.filter(a => a.id !== id)
    return {
      accounts: next,
      selectedAccount: state.selectedAccount?.id === id ? (next[0] ?? null) : state.selectedAccount,
    }
  }),
  updateAccountLocal: (id, data) => set((state) => ({
    accounts: state.accounts.map(a => a.id === id ? { ...a, ...data } : a),
    selectedAccount: state.selectedAccount?.id === id
      ? { ...state.selectedAccount, ...data }
      : state.selectedAccount,
  })),

  // Goals — local cache
  addGoal: (g) => set((state) => ({ goals: [...state.goals, g] })),
  removeGoal: (id) => set((state) => ({ goals: state.goals.filter(g => g.id !== id) })),
  updateGoal: (id, data) => set((state) => ({
    goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g),
  })),

  // Legacy aliases
  updateTransaction: (id, data) => set((state) => ({
    transactions: state.transactions.map(t => t.id === id ? { ...t, ...data } : t),
  })),
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id),
  })),
  updateAccount: (id, data) => set((state) => ({
    accounts: state.accounts.map(a => a.id === id ? { ...a, ...data } : a),
    selectedAccount: state.selectedAccount?.id === id
      ? { ...state.selectedAccount, ...data }
      : state.selectedAccount,
  })),
  deleteAccount: (id) => set((state) => {
    const next = state.accounts.filter(a => a.id !== id)
    return {
      accounts: next,
      selectedAccount: state.selectedAccount?.id === id ? (next[0] ?? null) : state.selectedAccount,
    }
  }),
  deleteGoal: (id) => set((state) => ({ goals: state.goals.filter(g => g.id !== id) })),
}))
