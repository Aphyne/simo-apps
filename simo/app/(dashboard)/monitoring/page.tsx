import { redirect } from 'next/navigation'

// Halaman Monitoring Stok dinonaktifkan atas keputusan Boss (19 Nov 2026): menunya dikomentari di Sidebar dan alamat
// /monitoring dialihkan ke Dashboard. Isi halaman lama tersimpan di git; untuk mengaktifkan kembali:
//   git show 8da8fbc:"simo/app/(dashboard)/monitoring/page.tsx" > "simo/app/(dashboard)/monitoring/page.tsx"
// lalu buka komentar menu Monitoring di components/layout/Sidebar.tsx. MonitoringTable dan useMonitoring sengaja
// dibiarkan supaya pengaktifan kembali cukup dua langkah itu.
export default function MonitoringPage() {
  redirect('/dashboard')
}
