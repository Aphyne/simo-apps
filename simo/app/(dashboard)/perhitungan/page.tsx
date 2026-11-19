import { redirect } from 'next/navigation'

// Halaman Perhitungan dinonaktifkan atas keputusan Boss (19 Nov 2026): menunya dikomentari di Sidebar dan alamat
// /perhitungan dialihkan ke Dashboard. Isi halaman lama tersimpan di git; untuk mengaktifkan kembali (mis. sementara untuk
// tangkapan layar lampiran skripsi):
//   git show 8da8fbc:"simo/app/(dashboard)/perhitungan/page.tsx" > "simo/app/(dashboard)/perhitungan/page.tsx"
// lalu buka komentar menunya di components/layout/Sidebar.tsx.
export default function PerhitunganPage() {
  redirect('/dashboard')
}
