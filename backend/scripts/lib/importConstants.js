// Disalin dari simo/lib/constants.ts (KATEGORI_OBAT, SATUAN_OBAT) — script impor
// backend tidak bisa require file .ts frontend langsung, jadi daftar baku ini
// harus tetap disinkronkan manual kalau constants.ts berubah.

const KATEGORI_OBAT = [
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
];

const SATUAN_OBAT = [
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
];

module.exports = { KATEGORI_OBAT, SATUAN_OBAT };
