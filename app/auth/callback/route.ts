import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ccqhglbmdqtnacgobidw.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

  if (code) {
    try {
      const cookieStore = await cookies()
      const forwardedHost = request.headers.get('x-forwarded-host')
      const host = forwardedHost || request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const baseUrl = host ? `${protocol}://${host}` : origin

      let redirectResponse = NextResponse.redirect(`${baseUrl}${next}`)

      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
              redirectResponse = NextResponse.redirect(`${baseUrl}${next}`)
              cookiesToSet.forEach(({ name, value, options }) =>
                redirectResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return redirectResponse
      } else {
        console.error('OAuth exchangeCodeForSession error:', error)
      }
    } catch (err) {
      console.error('OAuth callback exception:', err)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_error`)
}
