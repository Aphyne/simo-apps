// Diperluas berdasarkan data nyata Apotek Rezky Medika (impor data_obat_aptl_Rezky.xlsx) —
// kategori yang banyak dipakai apotek (Flu & Batuk, Alat Kesehatan, dst) dijadikan baku
// supaya tidak menumpuk di "Lainnya".
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
  'Antidiare',
  'Antiinflamasi',
  'Flu & Batuk',
  'Alat Kesehatan',
  'Salep',
  'Jamu',
  'Tetes Mata & Telinga',
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

export const SERVICE_LEVEL_OPTIONS = [
  { label: '90% (Z = 1.28)', value: 90 },
  { label: '95% (Z = 1.65)', value: 95 },
  { label: '97% (Z = 1.88)', value: 97 },
  { label: '99% (Z = 2.33)', value: 99 },
] as const

export const TOKEN_KEY = 'simo_token'
export const USER_KEY = 'simo_user'
