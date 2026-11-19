const TZ = 'Asia/Jakarta'

// "08 Nov 2026, 14.32.10" (WIB)
export function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// "8 Nov, 14.32" (WIB): untuk tabel yang sempit; tahun dan detik ada di ekspor.
export function formatWaktuSingkat(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
}

// "3 menit lalu", "2 jam lalu", "5 hari lalu"
export function waktuRelatif(iso: string | null | undefined): string {
  if (!iso) return 'Belum pernah'
  const detik = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (detik < 60) return 'Baru saja'
  const menit = Math.floor(detik / 60)
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  return `${Math.floor(jam / 24)} hari lalu`
}

// 394 -> "6 jam 34 menit", 45 -> "45 menit"
export function formatMenit(menit: number): string {
  if (menit < 60) return `${menit} menit`
  const j = Math.floor(menit / 60)
  const m = menit % 60
  return m ? `${j} jam ${m} menit` : `${j} jam`
}

// 394 -> "6j 34m": untuk ubin sempit; kalimat lengkap memakai formatMenit.
export function formatMenitRingkas(menit: number): string {
  if (menit < 60) return `${menit}m`
  const j = Math.floor(menit / 60)
  const m = menit % 60
  // Spasi tak-terputus ( ) supaya "6j 34m" tidak terpecah ke dua baris di ubin sempit.
  return m ? `${j}j${String.fromCharCode(160)}${m}m` : `${j}j`
}

// User-agent mentah -> "Chrome · Windows". Hanya untuk dibaca manusia; teks mentah tetap ada di ekspor.
export function ringkasPerangkat(ua: string | null | undefined): string {
  if (!ua) return '—'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Peramban lain'
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} · ${os}` : browser
}

export function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
