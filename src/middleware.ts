import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const tfa_verified    = request.cookies.get('tfa_v')?.value === '1'
  const is2FAPage       = pathname === '/auth/2fa'
  // isAuthPage excludes /auth/2fa (handled separately below)
  const isAuthPage      = pathname.startsWith('/auth/') && !is2FAPage
  const isAdminRoute    = pathname.startsWith('/admin')
  const isTreasurerRoute = pathname.startsWith('/treasurer')
  const isDonorRoute    = pathname.startsWith('/dashboard') || pathname.startsWith('/donate')
  const isSuperAdminUrl = pathname.startsWith('/annexeJ5')

  // ── Route /auth/2fa ───────────────────────────────────────────────────────
  if (is2FAPage) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    if (tfa_verified) {
      // Déjà vérifié — rediriger vers la destination
      const { data: adminData } = await supabase
        .from('admin_users').select('role').eq('id', user.id).single()
      const url = request.nextUrl.clone()
      url.pathname = adminData ? '/admin' : '/dashboard'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    // Session présente, 2FA non encore validée → afficher la page
    return supabaseResponse
  }

  // ── Routes protégées donateur ─────────────────────────────────────────────
  if (isDonorRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      const fullPath = request.nextUrl.search
        ? `${pathname}${request.nextUrl.search}`
        : pathname
      url.pathname = '/auth/login'
      url.search   = ''
      url.searchParams.set('redirectTo', fullPath)
      return NextResponse.redirect(url)
    }
    if (!tfa_verified) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/2fa'
      url.search   = ''
      return NextResponse.redirect(url)
    }
  }

  // ── Routes admin protégées ────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    if (!tfa_verified) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/2fa'
      url.search   = ''
      return NextResponse.redirect(url)
    }
  }

  // ── Routes trésorier : toujours redirigées vers /admin ────────────────────
  if (isTreasurerRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    if (!tfa_verified) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/2fa'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // ── /annexeJ5 : redirige si déjà entièrement connecté ────────────────────
  if (isSuperAdminUrl && user) {
    if (!tfa_verified) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/2fa'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    const { data: adminData } = await supabase
      .from('admin_users').select('role').eq('id', user.id).single()
    if (adminData?.role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // ── Pages auth : redirige si déjà connecté ────────────────────────────────
  if (isAuthPage && user) {
    if (!tfa_verified) {
      // Session présente mais 2FA non complétée → aller terminer la vérification
      const url = request.nextUrl.clone()
      url.pathname = '/auth/2fa'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    // Entièrement connecté → rediriger vers la destination
    const { data: adminData } = await supabase
      .from('admin_users').select('role').eq('id', user.id).single()

    const url = request.nextUrl.clone()
    if (adminData) {
      url.pathname = '/admin'
      url.search   = ''
      return NextResponse.redirect(url)
    }
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    if (redirectTo && redirectTo.startsWith('/')) {
      return NextResponse.redirect(new URL(redirectTo, request.nextUrl.origin))
    }
    url.pathname = '/dashboard'
    url.search   = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
