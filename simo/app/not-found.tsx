import ErrorPanel from '@/components/layout/ErrorPanel'

export default function NotFound() {
  return (
    <ErrorPanel
      judul="Halaman tidak ditemukan"
      pesan="Alamat yang dibuka tidak ada atau sudah dipindahkan."
    />
  )
}
