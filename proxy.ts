import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  // Allow login page and root
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }
  
  // For dashboard routes, check for auth session
  // Look for various Supabase cookie patterns
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(cookie => 
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  )
  
  // Log for debugging (visible in Vercel logs)
  console.log('Proxy check:', {
    path: request.nextUrl.pathname,
    cookies: cookies.map(c => c.name),
    hasAuth: hasAuthCookie
  })
  
  if (!hasAuthCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('No auth cookie, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

