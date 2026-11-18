// Logo apotek (Bowl of Hygieia, hitam tanpa latar) untuk kop PDF dan lembar pratinjau.
// Logo Bowl of Hygieia kiriman Boss, hitam tanpa latar. Berkas inilah satu-satunya salinan (aslinya sudah tidak ada di proyek):
// jangan dihapus. Ganti berkas di public/ untuk memakai logo lain.
// "?v=" memaksa peramban memuat berkas baru bila logonya diganti (naikkan angkanya saat berkas diganti).
export const LOGO_APOTEK_SRC = '/logo-apotek.png?v=2'

let logoCache: string | null | undefined

// Logo dimuat sekali sebagai data URL (untuk jsPDF.addImage). Gagal dimuat berarti kop tanpa logo, bukan galat.
export async function muatLogoApotek(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache
  try {
    const res = await fetch(LOGO_APOTEK_SRC)
    if (!res.ok) throw new Error(String(res.status))
    const bytes = new Uint8Array(await (await res.blob()).arrayBuffer())
    let biner = ''
    for (let i = 0; i < bytes.length; i += 0x8000) biner += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    logoCache = `data:image/png;base64,${btoa(biner)}`
  } catch {
    logoCache = null
  }
  return logoCache
}
