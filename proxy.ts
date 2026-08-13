import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 1. Skip static assets, PWA files, icons, and API routes
  const isAuthRoute   = pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/register')
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/icons') ||
                        pathname === '/manifest.json' || pathname === '/sw.js' ||
                        pathname === '/offline' || pathname.startsWith('/api') ||
                        pathname.includes('.')

  if (isPublicAsset) return NextResponse.next({ request })

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

    // 2. Direct Middleware OAuth Code Exchange:
    // If OAuth ?code=... param arrives at ANY URL, exchange it immediately in middleware where request.cookies (PKCE code_verifier) is active!
    if (searchParams.has('code')) {
      const code = searchParams.get('code')!
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          const cleanUrl = request.nextUrl.clone()
          cleanUrl.pathname = '/'
          cleanUrl.searchParams.delete('code')

          const redirectResponse = NextResponse.redirect(cleanUrl)
          supabaseResponse.cookies.getAll().forEach(c =>
            redirectResponse.cookies.set(c.name, c.value, c)
          )
          return redirectResponse
        } else {
          console.error('Middleware OAuth exchangeCodeForSession error:', error)
        }
      } catch (err) {
        console.error('Middleware OAuth exchange code exception:', err)
      }
    }

    // Refresh auth session & validate user token
    const { data: { user } } = await supabase.auth.getUser()

    // Protected route: Redirect unauthenticated user to /login
    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }

    // Auth route: Redirect authenticated user to /
    if (user && (pathname === '/login' || pathname === '/register')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
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
