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

  const isAuthPage        = pathname.startsWith('/auth/')
  const isAdminRoute      = pathname.startsWith('/admin')
  const isTreasurerRoute  = pathname.startsWith('/treasurer')
  const isDonorRoute      = pathname.startsWith('/dashboard') || pathname.startsWith('/donate')
  const isSuperAdminUrl   = pathname.startsWith('/annexeJ5')

  // ── Routes protégées donateur ─────────────────────────────────────────────
  if (isDonorRoute && !user) {
    const url = request.nextUrl.clone()
    const fullPath = request.nextUrl.search
      ? `${pathname}${request.nextUrl.search}`
      : pathname
    url.pathname = '/auth/login'
    url.search   = ''
    url.searchParams.set('redirectTo', fullPath)
    return NextResponse.redirect(url)
  }

  // ── Routes admin protégées ────────────────────────────────────────────────
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // ── Routes trésorier protégées ────────────────────────────────────────────
  if (isTreasurerRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // ── Vérifier que le trésorier a bien le bon rôle ──────────────────────────
  if (isTreasurerRoute && user) {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminData || adminData.role !== 'treasurer') {
      // Super admin ou autre admin → redirigé vers /admin
      if (adminData) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      // Pas admin du tout
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // ── /annexeJ5 : redirige si déjà connecté en super_admin ─────────────────
  if (isSuperAdminUrl && user) {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (adminData?.role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // ── Pages auth : redirige si déjà connecté ────────────────────────────────
  if (isAuthPage && user) {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    if (adminData?.role === 'treasurer') {
      url.pathname = '/treasurer'
      url.search = ''
      return NextResponse.redirect(url)
    }
    if (adminData) {
      url.pathname = '/admin'
      url.search = ''
      return NextResponse.redirect(url)
    }
    // Donateur — respecter redirectTo
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
