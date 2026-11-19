import type { Rentang } from '@/hooks/useAktivitas'

export type Periode = '7' | '30' | '90' | 'semua' | 'sendiri'

export const PERIODE_PILIHAN: { value: Periode; label: string }[] = [
  { value: '7', label: '7 hari terakhir' },
  { value: '30', label: '30 hari terakhir' },
  { value: '90', label: '90 hari terakhir' },
  { value: 'semua', label: 'Semua waktu' },
  { value: 'sendiri', label: 'Pilih tanggal sendiri' },
]

export const PERIODE_BAWAAN: Periode = '7'

export function periodeValid(v: string | null): Periode {
  return PERIODE_PILIHAN.some((p) => p.value === v) ? (v as Periode) : PERIODE_BAWAAN
}

const TGL = /^\d{4}-\d{2}-\d{2}$/

// Hari ini menurut WIB sebagai YYYY-MM-DD (bukan UTC, supaya "hari ini" sama dengan yang dihitung server).
function hariIniWib(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

function kurangiHari(tgl: string, n: number): string {
  return new Date(Date.parse(tgl) - n * 86400000).toISOString().slice(0, 10)
}

// Periode (dan tanggal sendiri) -> rentang untuk API. "7 hari terakhir" = hari ini dan 6 hari sebelumnya.
export function hitungRentang(periode: Periode, dari?: string | null, sampai?: string | null): Rentang {
  if (periode === 'semua') return {}
  if (periode === 'sendiri') {
    return { dari: dari && TGL.test(dari) ? dari : undefined, sampai: sampai && TGL.test(sampai) ? sampai : undefined }
  }
  const hariIni = hariIniWib()
  return { dari: kurangiHari(hariIni, Number(periode) - 1), sampai: hariIni }
}

// Hanya hari ini (WIB): untuk lonceng peneliti, yang memakai analitik semurah mungkin karena temuan tidak bergantung rentang.
export function rentangHariIni(): Rentang {
  const h = hariIniWib()
  return { dari: h, sampai: h }
}

export function labelPeriode(periode: Periode, rentang: { dari: string; sampai: string } | undefined): string {
  if (periode === 'semua') return 'sepanjang waktu'
  if (periode === 'sendiri' && rentang) return `${rentang.dari} sampai ${rentang.sampai}`
  return PERIODE_PILIHAN.find((p) => p.value === periode)?.label.toLowerCase() ?? ''
}
