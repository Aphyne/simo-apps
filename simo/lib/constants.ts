export const KATEGORI_OBAT = [
  'Analgesik',
  'Antibiotik',
  'Antasida',
  'Antihistamin',
  'Vitamin',
  'Suplemen',
  'Antidiabetik',
  'Antihipertensi',
  'Antijamur',
  'Lainnya',
] as const

export const SATUAN_OBAT = [
  'tablet',
  'kapsul',
  'strip',
  'botol',
  'dus',
  'ampul',
  'vial',
  'sachet',
  'tube',
  'tetes',
] as const

export const KETERANGAN_KELUAR = [
  'Penjualan',
  'Retur',
  'Rusak',
  'Kedaluarsa',
  'Lainnya',
] as const

export const SERVICE_LEVEL_OPTIONS = [
  { label: '90% (Z = 1.28)', value: 90 },
  { label: '95% (Z = 1.65)', value: 95 },
  { label: '97% (Z = 1.88)', value: 97 },
  { label: '99% (Z = 2.33)', value: 99 },
] as const

export const STATUS_STOK = {
  AMAN: 'AMAN',
  MENDEKATI_ROP: 'MENDEKATI_ROP',
  HARUS_REORDER: 'HARUS_REORDER',
} as const

export const STATUS_LABEL: Record<string, string> = {
  AMAN: 'Aman',
  MENDEKATI_ROP: 'Mendekati ROP',
  HARUS_REORDER: 'Harus Reorder',
}

export const TOKEN_KEY = 'simo_token'
export const USER_KEY = 'simo_user'
