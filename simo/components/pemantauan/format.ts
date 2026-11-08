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

export function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
