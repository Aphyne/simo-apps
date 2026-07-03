export type StatusStok = 'AMAN' | 'MENDEKATI_ROP' | 'HARUS_REORDER'

export interface Obat {
  id: number
  kode: string
  nama: string
  kategori: string
  satuan: string
  satuan_per_dus: number
  harga_beli: number
  harga_jual: number
  stok: number
  biaya_pesan: number
  biaya_simpan: number
  lead_time: number
  service_level: number

  // Hasil kalkulasi (dari backend)
  eoq: number | null
  safety_stock: number | null
  rop: number | null
  total_biaya: number | null
  demand_harian: number | null
  std_dev_demand: number | null
  demand_tahunan: number | null

  // Info tambahan
  expired_terdekat: string | null
  supplier_id: number | null
  nama_supplier: string | null
  created_at: string
  updated_at: string

  // Computed di frontend
  status: StatusStok
  estimasi_habis_hari: number | null
}

export interface ObatFormData {
  nama: string
  kategori: string
  satuan: string
  satuan_per_dus: number
  stok: number
  demand_harian: number
  demand_tahunan: number
  std_dev_demand: number
  biaya_pesan: number
  service_level: number
  expired_terdekat?: string
  supplier_id?: number
}

export interface BarangMasuk {
  id: number
  tanggal: string
  obat_id: number
  nama_obat: string
  kode_obat: string
  satuan: string
  jumlah_dus: number
  jumlah_satuan: number
  supplier_id: number | null
  nama_supplier: string | null
  no_faktur: string | null
  no_batch: string | null
  expired_batch: string | null
  harga_beli: number | null
  harga_jual: number | null
  catatan: string | null
  stok_sebelum: number
  stok_sesudah: number
  nama_user: string | null
  username: string | null
  role_user: string | null
  created_at: string
}

export interface BarangMasukFormData {
  tanggal: string
  obat_id: number
  jumlah_dus: number
  supplier_id?: number
  no_faktur?: string
  no_batch?: string
  expired_batch?: string
  harga_beli_dus?: number
  harga_jual?: number
  biaya_simpan_pct?: number
  catatan?: string
}

export interface BarangKeluar {
  id: number
  tanggal: string
  obat_id: number
  nama_obat: string
  kode_obat: string
  satuan: string
  jumlah: number
  harga_jual?: number
  keterangan: string
  catatan: string | null
  stok_sebelum: number
  stok_sesudah: number
  nama_user: string | null
  username: string | null
  role_user: string | null
  created_at: string
}

export interface BarangKeluarFormData {
  tanggal: string
  obat_id: number
  jumlah: number
  keterangan: string
  catatan?: string
}

export interface BarangKeluarResponse {
  transaksi: BarangKeluar
  stok_sesudah: number
  reorder_alert: boolean
  reorder_info?: {
    stok: number
    rop: number
    eoq: number | null
    nama_obat: string
  }
}

export interface LangkahPerhitungan {
  rumus: string
  substitusi: string
  langkah?: string
  hasil: number | null
  catatan?: string
}

export interface DetailPerhitungan {
  obat: Pick<Obat, 'id' | 'nama' | 'kode'>
  input: {
    D: number
    S: number
    H: number
    LT: number
    Z: number
    sigma: number
    demand_harian: number
  }
  langkah_eoq: LangkahPerhitungan
  langkah_safety_stock: LangkahPerhitungan
  langkah_rop: LangkahPerhitungan
  langkah_tc: LangkahPerhitungan
}

export interface HasilSimulasi {
  nilai_sekarang: NilaiEoq
  nilai_simulasi: NilaiEoq
  selisih: SelisihEoq
}

interface NilaiEoq {
  demand_tahunan: number
  eoq: number
  safety_stock: number
  rop: number
  total_biaya: number
}

interface SelisihEoq {
  demand_tahunan_pct: number
  eoq_unit: number
  safety_stock_unit: number
  rop_unit: number
  total_biaya_rp: number
}

export interface SimulasiSkenario {
  id: number
  obat_id: number
  nama_obat: string
  nama_skenario: string | null
  parameter_input: {
    demand_perubahan_pct?: number
    demand_nilai_baru?: number
    lead_time_baru?: number
    biaya_simpan_baru?: number
    biaya_pesan_baru?: number
  }
  hasil_simulasi: HasilSimulasi
  created_at: string
}
