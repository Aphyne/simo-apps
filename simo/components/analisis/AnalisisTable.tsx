'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { TabelData, type KolomData } from '@/components/shared/TabelData'
import type { AnalisisDetail, AnalisisRingkasan } from '@/hooks/useAnalisis'
import { formatAngka, formatRupiah } from '@/lib/utils'

interface Props {
  detail: AnalisisDetail[]
  ringkasan: AnalisisRingkasan | undefined
  isLoading: boolean
  isError: boolean
  onCobaLagi: () => void
  onSelectItem: (item: AnalisisDetail) => void
}

const PER_HALAMAN = 15
const persen = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('id-ID')}%`

// Tabel rincian per obat, urut dari penghematan terbesar. Kolom bertahap menurut lebar konten (jumlah sekali pesan dan
// frekuensi mulai xl). Baris penutup menjumlahkan semua obat (bukan hanya halaman ini) dan sama dengan ubin di atas.
export default function AnalisisTable({ detail, ringkasan, isLoading, isError, onCobaLagi, onSelectItem }: Props) {
  const [halaman, setHalaman] = useState<number | null>(null)
  const baris = useMemo(() => [...detail].sort((a, b) => b.penghematan - a.penghematan), [detail])

  const kolom: KolomData<AnalisisDetail>[] = [
    {
      id: 'obat',
      judul: 'Obat',
      skeleton: ['w-36', 'w-24'],
      sel: (d) => (
        <div className="min-w-0">
          <button type="button" onClick={() => onSelectItem(d)} className="rounded-md text-left font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
            {d.nama}
          </button>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{d.kode} · {d.satuan}</p>
        </div>
      ),
    },
    {
      id: 'jumlah',
      judul: 'Sekali pesan',
      kelas: 'hidden xl:table-cell',
      skeleton: ['w-32', 'w-32'],
      sel: (d) => (
        <div className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          <p>Sebelum: <span className="text-foreground">{formatAngka(d.q_tradisional, 0)}</span> ({formatAngka(d.asumsi_dus, 0)} dus)</p>
          <p className="mt-0.5">EOQ: <span className="text-foreground">{formatAngka(d.q_eoq, 0)}</span> ({formatAngka(d.q_eoq_dus, 1)} dus)</p>
        </div>
      ),
    },
    {
      id: 'frekuensi',
      judul: 'Pesan per tahun',
      kelas: 'hidden xl:table-cell',
      skeleton: ['w-28', 'w-28'],
      sel: (d) => (
        <div className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          <p>Sebelum: <span className="text-foreground">{formatAngka(d.frek_tradisional, 1)}×</span></p>
          <p className="mt-0.5">EOQ: <span className="text-foreground">{formatAngka(d.frek_eoq, 1)}×</span></p>
        </div>
      ),
    },
    { id: 'sebelum', judul: 'Biaya sebelum EOQ', kanan: true, skeleton: 'w-24', sel: (d) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{formatRupiah(d.tc_tradisional)}</span> },
    { id: 'eoq', judul: 'Biaya dengan EOQ', kanan: true, skeleton: 'w-24', sel: (d) => <span className="whitespace-nowrap font-medium tabular-nums text-foreground">{formatRupiah(d.tc_eoq)}</span> },
    { id: 'hemat', judul: 'Penghematan', kanan: true, kelas: 'hidden md:table-cell', skeleton: 'w-24', sel: (d) => <span className="whitespace-nowrap font-medium tabular-nums text-primary">{formatRupiah(d.penghematan)}</span> },
    { id: 'persen', judul: '% hemat', kanan: true, kelas: 'hidden sm:table-cell', skeleton: 'w-14', sel: (d) => <Badge variant="secondary" className="tabular-nums">{persen(d.persen_hemat)}</Badge> },
  ]

  return (
    <TabelData
      kolom={kolom}
      baris={baris}
      kunci={(d) => d.id}
      isLoading={isLoading}
      isError={isError}
      onCobaLagi={onCobaLagi}
      judulGagal="Perbandingan belum bisa dimuat"
      kosong={{ judul: 'Belum ada obat yang bisa dibandingkan', keterangan: 'Lengkapi biaya pesan, biaya simpan, isi per dus, dan pastikan ada penjualan 30 hari terakhir pada data obat.' }}
      footer={
        ringkasan
          ? [{
              label: 'Total semua obat',
              nilai: {
                sebelum: formatRupiah(ringkasan.total_tc_tradisional),
                eoq: formatRupiah(ringkasan.total_tc_eoq),
                hemat: <span className="text-primary">{formatRupiah(ringkasan.total_penghematan)}</span>,
                persen: persen(ringkasan.persen_hemat_total),
              },
            }]
          : undefined
      }
      halaman={halaman}
      onHalaman={setHalaman}
      perHalaman={PER_HALAMAN}
      barisSkeleton={6}
      noun="obat"
    />
  )
}
