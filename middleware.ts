import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/invite'
  // Removed '/' - now requires authentication
]

// Routes that require admin access
const ADMIN_ROUTES = [
  '/admin',
  '/settings/organization',
  '/settings/billing'
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // Refresh session if expired
  const { data: { user }, error } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check admin access for admin routes
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Check if user has completed onboarding (has organization)
  if (user && !isPublicRoute && pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id && pathname !== '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}