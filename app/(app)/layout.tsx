import BottomNav from '@/components/ui/bottom-nav'
import NoWalletGuard from '@/components/wallet/no-wallet-guard'
import OCRWarmup from '@/components/ocr-warmup'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-[430px] bg-white shadow-xl min-h-screen relative flex flex-col">
        <OCRWarmup />
        <NoWalletGuard />
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
