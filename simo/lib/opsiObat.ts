// Kategori dan satuan obat: daftar baku (lib/constants.ts) ditambah nilai yang sudah dipakai obat di database. Server
// tidak membatasi nilainya, jadi kategori/satuan baru cukup dibuat dari kolom pilihan dan langsung masuk daftar begitu
// ada obat yang memakainya.

// Sama dengan perapian di backend (obatController.samakanOpsi), supaya yang tampil di "Tambah ... baru" persis yang tersimpan.
export function rapikanKategori(teks: string): string {
  return teks
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|[\s\-/(])([a-z])/g, (_, pemisah: string, huruf: string) => pemisah + huruf.toUpperCase())
}

export function rapikanSatuan(teks: string): string {
  return teks.trim().replace(/\s+/g, ' ').toLowerCase()
}

export const MAKS_KATEGORI = 40
export const MAKS_SATUAN = 30

// Daftar baku dulu (urutan tetap), lalu tambahan dari database menurut abjad; tanpa duplikat yang hanya beda huruf.
export function gabungOpsi(baku: readonly string[], dariDb: readonly string[] | undefined): { value: string; label: string }[] {
  const lihat = new Set(baku.map((b) => b.toLowerCase()))
  const tambahan = (dariDb ?? [])
    .filter((v) => v && !lihat.has(v.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'id'))
  return [...baku, ...tambahan].map((v) => ({ value: v, label: v }))
}

// Jarak edit (Levenshtein): berapa penyuntingan satu huruf yang diperlukan untuk mengubah a menjadi b.
function jarakEdit(a: string, b: string): number {
  const baris = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let kiriAtas = baris[0]
    baris[0] = i
    for (let j = 1; j <= b.length; j++) {
      const atas = baris[j]
      baris[j] = Math.min(baris[j] + 1, baris[j - 1] + 1, kiriAtas + (a[i - 1] === b[j - 1] ? 0 : 1))
      kiriAtas = atas
    }
  }
  return baris[b.length]
}

// Pilihan yang hampir sama dengan teks yang diketik (salah ketik: huruf lebih, kurang, atau tertukar). Dipakai untuk
// menawarkan "Maksud Anda ...?" sebelum pengguna membuat nilai baru yang sebenarnya salah ketik. Teks pendek dibuat lebih
// ketat supaya kata yang memang berbeda tidak dianggap mirip. Paling banyak `maks` saran, yang terdekat dulu.
export function cariMirip(teks: string, pilihan: readonly string[], maks = 2): string[] {
  const t = teks.trim().toLowerCase()
  if (t.length < 4) return []
  const batas = t.length >= 7 ? 2 : 1
  return pilihan
    .map((p) => ({ p, jarak: jarakEdit(t, p.toLowerCase()) }))
    .filter((x) => x.jarak > 0 && x.jarak <= batas)
    .sort((a, b) => a.jarak - b.jarak || a.p.localeCompare(b.p, 'id'))
    .slice(0, maks)
    .map((x) => x.p)
}
