import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { APP_URL, arahDomain } from '@/lib/domain'

const PUBLIC_PATHS = ['/login']
// Halaman mandiri (style guide komponen) — tetap bisa dibuka meski sudah login
// (beda dari /login yang redirect ke dashboard). Hanya di mode pengembangan
// terbuka tanpa login; di produksi /design wajib cookie login, lalu pembatasan
// ke superadmin dilakukan komponen SuperadminOnly di app/design/layout.tsx.
const STANDALONE_PATHS = process.env.NODE_ENV === 'production' ? [] : ['/design']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware untuk static files dan API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (STANDALONE_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Cek token dari cookie (dikirim frontend saat login)
  const token = request.cookies.get('simo_token')?.value

  // Produksi dengan dua domain (lib/domain.ts): simoo.online = halaman depan, app.simoo.online = aplikasi.
  const arah = arahDomain(APP_URL, request.headers.get('host') || '', pathname, request.nextUrl.search, Boolean(token))
  if (arah?.jenis === 'lanjut') return NextResponse.next()
  if (arah?.jenis === 'alihkan') return NextResponse.redirect(new URL(arah.ke, request.url))

  // Halaman depan (landing page) untuk calon pengguna: hanya alamat "/" persis.
  // Yang sudah login langsung ke Dashboard (pemakai harian membuka simoo.online).
  if (pathname === '/') {
    return token ? NextResponse.redirect(new URL('/dashboard', request.url)) : NextResponse.next()
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Belum login → ke /login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Sudah login → tidak perlu ke /login lagi
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
