export interface Supplier {
  id: number
  nama: string
  alamat: string | null
  telepon: string | null
  whatsapp: string | null
  jenis_obat: string | null
  lead_time_avg: number
  created_at: string
  updated_at: string
}

export interface SupplierFormData {
  nama: string
  alamat?: string
  telepon?: string
  whatsapp?: string
  jenis_obat?: string
  lead_time_avg: number
}
