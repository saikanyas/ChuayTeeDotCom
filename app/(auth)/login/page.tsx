'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import logoImg from '@/app/CatWalletLogo-1024px.png'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-logo-frame">
            <Image
              src={logoImg}
              alt="แมวในกระเป๋าเงินสีชมพู"
              width={112}
              height={112}
              className="login-logo"
              priority
            />
          </div>
          <p className="login-kicker">จัดการเงินแบบสบายใจ</p>
          <h1 id="login-title">ช่วยที<span>.com</span></h1>
          <p className="login-tagline">เพื่อนช่วยรอดสิ้นเดือน สำหรับนักศึกษา</p>
        </div>

        <div className="login-divider" aria-hidden="true">
          <span />
          <span className="login-paw">✦</span>
          <span />
        </div>

        <div className="login-action">
          <p className="login-welcome">พร้อมเริ่มดูแลเงินของคุณหรือยัง?</p>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="google-login-button"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>{googleLoading ? 'กำลังพาไปที่ Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
          </button>
          {error && <p className="login-error" role="alert">{error}</p>}
          <p className="login-note">เข้าใช้งานได้ทันทีด้วยบัญชี Google<br />ข้อมูลการเงินของคุณเป็นเรื่องส่วนตัวเสมอ</p>
        </div>
      </section>
      <p className="login-footer">ช่วยให้ทุกสิ้นเดือนเบาลงอีกนิด ♡</p>
    </main>
  )
}
