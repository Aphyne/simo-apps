// Pemisahan domain produksi: halaman depan di domain utama (simoo.online), aplikasi di subdomain
// (app.simoo.online). Aktif hanya bila NEXT_PUBLIC_APP_URL diisi (mis. "https://app.simoo.online");
// kosong = satu domain seperti biasa (lokal, uji, pratinjau).

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')

// Tujuan tombol "Masuk ke SIMO" di halaman depan.
export const URL_MASUK = APP_URL ? `${APP_URL}/login` : '/login'

export type Arah = { jenis: 'lanjut' } | { jenis: 'alihkan'; ke: string }

// null = tidak ada aturan domain yang berlaku (lanjut ke aturan login biasa).
// "ke" bisa alamat penuh (pindah domain) atau path (tetap di domain yang sama).
export function arahDomain(appUrl: string, host: string, pathname: string, search: string, adaToken: boolean): Arah | null {
  if (!appUrl) return null
  let app: URL
  try { app = new URL(appUrl) } catch { return null }
  const hostApp = app.host.toLowerCase()
  const hostDepan = hostApp.replace(/^app\./, '')
  if (hostDepan === hostApp) return null // APP_URL bukan subdomain app.*; jangan menebak
  const h = host.toLowerCase().replace(/^www\./, '')

  if (h === hostDepan) {
    // Domain utama hanya untuk halaman depan; alamat aplikasi dipindah ke subdomain app.
    return pathname === '/' ? { jenis: 'lanjut' } : { jenis: 'alihkan', ke: `${app.origin}${pathname}${search}` }
  }
  if (h === hostApp && pathname === '/') {
    // Subdomain aplikasi tidak punya halaman depan: langsung ke Dashboard atau halaman masuk.
    return { jenis: 'alihkan', ke: adaToken ? '/dashboard' : '/login' }
  }
  return null
}
