export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-50">
      <div className="w-full max-w-[400px] bg-white shadow-xl min-h-screen relative">
        {children}
      </div>
    </div>
  )
}
