'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/'
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // ใช้ origin ปัจจุบัน — ทำงานทั้ง localhost และ Vercel โดยอัตโนมัติ
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // หาก success จะ redirect ออกจากหน้านี้ไปยัง Google — ไม่ต้อง setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg)', backgroundImage: 'linear-gradient(to bottom, var(--color-surface-tint), transparent)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <img 
          src="/logo.png" 
          alt="ช่วยที.com Logo" 
          className="w-24 h-24 rounded-3xl object-cover shadow-md mb-4 hover:scale-105 transition-transform" 
        />
        <h1 className="text-3xl font-display font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>ช่วยที.com</h1>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-second)' }}>เพื่อนช่วยรอดสิ้นเดือน สำหรับนักศึกษา</p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <input {...register('email')} type="email" placeholder="อีเมล" className="input-field w-full" />
          <input {...register('password')} type="password" placeholder="รหัสผ่าน" className="input-field w-full" />
          {error && <p style={{ color: 'var(--color-expense)' }} className="text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 w-full space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 rounded-full border bg-white flex items-center justify-center gap-3 font-bold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', opacity: googleLoading ? 0.6 : 1 }}
          >
            {/* Google G logo SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}
          </button>
          <p className="text-center text-sm" style={{ color: 'var(--color-text-second)' }}>
            ยังไม่มีบัญชี? <Link href="/register" style={{ color: 'var(--color-primary)' }}>สมัครสมาชิก</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
