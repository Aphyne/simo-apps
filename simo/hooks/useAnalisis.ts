'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AnalisisDetail {
  id: number
  kode: string
  nama: string
  satuan: string
  // Isi satu dus dalam satuan terkecil.
  satuan_per_dus: number
  demand_tahunan: number
  biaya_pesan: number
  biaya_simpan: number
  // Asumsi sebelum EOQ: jumlah dus tiap pemesanan (setting), dan hasilnya dalam satuan terkecil.
  asumsi_dus: number
  q_tradisional: number
  q_eoq: number
  q_eoq_dus: number
  // Berapa kali pesan per tahun (D / Q).
  frek_tradisional: number
  frek_eoq: number
  // Komponen biaya per tahun (Rp, sudah dibulatkan); total = pemesanan + penyimpanan.
  bp_tradisional: number
  bs_tradisional: number
  bp_eoq: number
  bs_eoq: number
  tc_tradisional: number
  tc_eoq: number
  penghematan: number
  persen_hemat: number
}

export interface AnalisisRingkasan {
  total_obat: number
  total_obat_dihitung: number
  // Obat yang tidak ikut dihitung, dikelompokkan menurut satu alasan (berurutan).
  tidak_dihitung: {
    tanpa_biaya_pesan: number
    tanpa_biaya_simpan: number
    tanpa_demand: number
    tanpa_isi_dus: number
  }
  // Jumlah obat yang EOQ tersimpannya berbeda dari hitungan sekarang (perlu hitung ulang).
  eoq_tersimpan_beda: number
  total_tc_tradisional: number
  total_tc_eoq: number
  total_bp_tradisional: number
  total_bs_tradisional: number
  total_bp_eoq: number
  total_bs_eoq: number
  total_penghematan: number
  persen_hemat_total: number
  asumsi_dus_tradisional: number
}

export interface AnalisisData {
  ringkasan: AnalisisRingkasan
  detail: AnalisisDetail[]
}

// `aktif` = false menahan panggilan API (dipakai halaman yang hanya boleh dibuka superadmin).
export function useAnalisisPerbandingan(aktif = true) {
  return useQuery({
    queryKey: ['analisis-perbandingan'],
    enabled: aktif,
    queryFn: async () => {
      const res = await api.get('/analisis/perbandingan')
      return res.data.data as AnalisisData
    },
  })
}
