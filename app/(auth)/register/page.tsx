'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const supabase = createClient()
  
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.name
        }
      }
    })
    
    if (authError) setError(authError.message)
    else window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg)', backgroundImage: 'linear-gradient(to bottom, var(--color-surface-tint), transparent)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-display font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>สมัครสมาชิก</h1>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-second)' }}>เริ่มจัดการเงินของคุณวันนี้</p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <input {...register('name')} type="text" placeholder="ชื่อ - นามสกุล" className="input-field w-full" />
          <input {...register('email')} type="email" placeholder="อีเมล" className="input-field w-full" />
          <input {...register('password')} type="password" placeholder="รหัสผ่าน" className="input-field w-full" />
          {error && <p style={{ color: 'var(--color-expense)' }} className="text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            สมัครสมาชิก
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-second)' }}>
          มีบัญชีอยู่แล้ว? <Link href="/login" style={{ color: 'var(--color-primary)' }}>เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
