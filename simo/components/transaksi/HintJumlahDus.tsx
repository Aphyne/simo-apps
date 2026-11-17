import { FieldDescription } from '@/components/ui/field'
import { konversiDus } from '@/lib/barangMasuk'
import { formatAngka } from '@/lib/utils'

interface Props {
  id: string
  // Jumlah dus yang diketik (boleh pecahan). NaN atau 0 = belum diisi.
  dus: number
  // Kosong bila obat belum dipilih: hanya petunjuk biasa yang tampil.
  satuanPerDus?: number
  satuan?: string
  // Stok obat sebelum baris ini. Kosong bila belum diketahui.
  stokSebelum?: number
}

// Kalimat di bawah kolom "Jumlah (dus)". Sesudah obat dipilih dan jumlah diisi, tertulis hasilnya dalam satuan
// dan stok sesudahnya, mis. "2,5 dus = 250 tablet. Stok berubah dari 130 menjadi 380 tablet."
export default function HintJumlahDus({ id, dus, satuanPerDus, satuan, stokSebelum }: Props) {
  if (!satuanPerDus || !satuan || !(dus > 0)) {
    return <FieldDescription id={id}>Boleh pecahan, mis. 2,5 dus.</FieldDescription>
  }
  const jumlah = konversiDus(dus, satuanPerDus)
  return (
    <FieldDescription id={id}>
      <span className="font-medium text-foreground">{formatAngka(dus, 2)} dus = {formatAngka(jumlah, 0)} {satuan}.</span>
      {stokSebelum !== undefined && (
        <> Stok berubah dari {formatAngka(stokSebelum, 0)} menjadi <span className="font-medium text-foreground">{formatAngka(stokSebelum + jumlah, 0)} {satuan}</span>.</>
      )}
    </FieldDescription>
  )
}
