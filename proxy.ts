import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public static assets & routes that never require auth middleware checks
  const isAuthRoute   = pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/register')
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/icons') ||
                        pathname === '/manifest.json' || pathname === '/sw.js' ||
                        pathname === '/offline' || pathname.startsWith('/api') ||
                        pathname.includes('.')

  if (isPublicAsset) return NextResponse.next({ request })

  // Prioritize NEXT_PUBLIC_SUPABASE_ANON_KEY from Vercel Supabase Integration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Validate auth token
    const { data: { user } } = await supabase.auth.getUser()

    // Protect private routes: Redirect unauthenticated users to /login
    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login/register
    if (user && (pathname === '/login' || pathname === '/register')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('Middleware auth check exception:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
