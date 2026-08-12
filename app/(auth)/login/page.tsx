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
  const supabase = createClient()
  
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg)', backgroundImage: 'linear-gradient(to bottom, var(--color-surface-tint), transparent)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--color-primary)' }}>
          <span className="text-white text-3xl font-display font-bold">ช</span>
        </div>
        <h1 className="text-3xl font-display font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>ช่วยที.com</h1>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-second)' }}>เพื่อนช่วยรอดสิ้นเดือน สำหรับนักศึกษา</p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <input {...register('email')} type="email" placeholder="อีเมล" className="input-field w-full" />
          <input {...register('password')} type="password" placeholder="รหัสผ่าน" className="input-field w-full" />
          {error && <p style={{ color: 'var(--color-expense)' }} className="text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-6 w-full space-y-4">
          <button className="w-full py-3 rounded-full border bg-white text-center font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            เข้าสู่ระบบด้วย Google
          </button>
          <p className="text-center text-sm" style={{ color: 'var(--color-text-second)' }}>
            ยังไม่มีบัญชี? <Link href="/register" style={{ color: 'var(--color-primary)' }}>สมัครสมาชิก</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
