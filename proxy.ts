import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ccqhglbmdqtnacgobidw.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 1. Skip static assets, PWA files, icons, and API routes
  const isAuthRoute   = pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/register')
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/icons') ||
                        pathname === '/manifest.json' || pathname === '/sw.js' ||
                        pathname === '/offline' || pathname.startsWith('/api') ||
                        pathname.includes('.')

  if (isPublicAsset) return NextResponse.next({ request })

  // 2. Forward OAuth ?code=... parameter to /auth/callback WITH ALL COOKIES PRESERVED
  if (searchParams.has('code') && !pathname.startsWith('/auth/callback')) {
    const url = new URL('/auth/callback', request.url)
    url.searchParams.set('code', searchParams.get('code')!)
    const redirectResponse = NextResponse.redirect(url)
    request.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, { ...c, path: '/', sameSite: 'lax', secure: true }))
    return redirectResponse
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookieOptions: {
          name: 'sb-ccqhglbmdqtnacgobidw-auth-token',
          path: '/',
          sameSite: 'lax',
          secure: true,
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true })
            )
          },
        },
      }
    )

    // Refresh auth session & validate user token
    const { data: { user } } = await supabase.auth.getUser()

    // Protected route: Redirect unauthenticated user to /login cleanly
    if (!user && !isAuthRoute) {
      const url = new URL('/login', request.url)
      if (searchParams.has('error')) {
        url.searchParams.set('error', searchParams.get('error')!)
      }
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, { ...c, path: '/', sameSite: 'lax', secure: true }))
      return redirectResponse
    }

    // Auth route: Redirect authenticated user cleanly to /
    if (user && (pathname === '/login' || pathname === '/register')) {
      const url = new URL('/', request.url)
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, { ...c, path: '/', sameSite: 'lax', secure: true }))
      return redirectResponse
    }
  } catch (err) {
    console.error('Middleware auth check exception:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
