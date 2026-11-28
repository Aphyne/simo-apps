import { Info, TriangleAlert } from 'lucide-react'
import type { AnalisisRingkasan } from '@/hooks/useAnalisis'

// Cara menghitung dan batasannya, ditulis di halaman supaya tangkapan layar tidak berdiri sendiri tanpa konteks
// (dasar demand, asumsi sebelum EOQ, dan obat yang tidak ikut). Semuanya fakta dari kode, bukan klaim baru.
export default function AnalisisCatatan({ ringkasan: r }: { ringkasan: AnalisisRingkasan }) {
  const t = r.tidak_dihitung
  const tidak = r.total_obat - r.total_obat_dihitung
  const alasan = [
    t.tanpa_biaya_pesan > 0 && `${t.tanpa_biaya_pesan} belum punya biaya pesan`,
    t.tanpa_biaya_simpan > 0 && `${t.tanpa_biaya_simpan} belum punya biaya simpan`,
    t.tanpa_demand > 0 && `${t.tanpa_demand} tanpa penjualan sejak tanggal cut-off`,
    t.tanpa_isi_dus > 0 && `${t.tanpa_isi_dus} belum punya isi per dus`,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      {r.eoq_tersimpan_beda > 0 && (
        <p role="status" className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-3.5 text-sm text-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            <b className="font-semibold">{r.eoq_tersimpan_beda} obat</b> punya EOQ tersimpan yang berbeda lebih dari 1% dari hitungan sekarang. Halaman ini menghitung dari data terbaru,
            jadi halaman Data Obat bisa menampilkan angka EOQ yang berbeda sampai obat itu dihitung ulang. Hitung ulang obat tersebut dulu bila angkanya akan dikutip bersama.
          </span>
        </p>
      )}

      <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-semibold text-foreground">Sebelum EOQ:</b> setiap pemesanan {r.asumsi_dus_tradisional} dus (asumsi), jadi jumlah sekali pesan = {r.asumsi_dus_tradisional} × isi per dus tiap obat.
            <b className="font-semibold text-foreground"> Dengan EOQ:</b> jumlah sekali pesan = √(2 × D × S ÷ H).
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-semibold text-foreground">Biaya per tahun</b> = biaya pemesanan (D ÷ Q × S) + biaya penyimpanan (Q ÷ 2 × H). Safety stock tidak dimasukkan karena nilainya sama di kedua skenario sehingga tidak mengubah selisih.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-semibold text-foreground">Kebutuhan per tahun (D)</b> = rata-rata penjualan harian sejak tanggal cut-off (paling lama 365 hari terakhir) × 365. Selama datanya belum setahun penuh, ini proyeksi, sehingga pola musiman belum tercakup.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-semibold text-foreground">EOQ</b> adalah angka teoritis dan tidak dibulatkan ke dus penuh. Penghematan adalah perkiraan biaya per tahun, bukan biaya yang sudah terjadi.
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-semibold text-foreground">{r.total_obat_dihitung} dari {r.total_obat} obat</b> ikut dibandingkan.
            {tidak > 0 ? ` Sisanya (${tidak}) tidak bisa dihitung: ${alasan.join(', ')}.` : ' Semua obat bisa dihitung.'}
          </span>
        </li>
      </ul>
    </div>
  )
}
