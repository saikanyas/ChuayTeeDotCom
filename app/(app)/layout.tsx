import BottomNav from '@/components/ui/bottom-nav'
import NoWalletGuard from '@/components/wallet/no-wallet-guard'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-[430px] bg-white shadow-xl min-h-screen relative flex flex-col">
        <NoWalletGuard />
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
