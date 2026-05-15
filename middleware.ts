import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/ranking']
const ADMIN_PATHS = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rutas de API: verificar token pero dejar que los handlers manejen autorización
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '?'))
  const session = await getSessionFromRequest(req)

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const isAdmin = ADMIN_PATHS.some(p => pathname.startsWith(p))
  if (isAdmin && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
