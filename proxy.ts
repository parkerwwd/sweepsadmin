import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  // Allow login page
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }
  
  // For dashboard routes, check for auth session
  // This is a simple check - in production you'd verify the session token
  const hasSession = request.cookies.get('sb-access-token') || 
                     request.cookies.get('sb-refresh-token')
  
  if (!hasSession && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

