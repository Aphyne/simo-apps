import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import Navbar from '@/components/landing/Navbar'
import {
  BagianAjakan, BagianCaraKerja, BagianDemo, BagianDetail, BagianFitur, BagianPembuka, BagianPernyataan, BagianTanyaJawab, Footer,
} from '@/components/landing/Bagian'
import { hurufSerif } from '@/components/landing/huruf'
import gaya from '@/components/landing/landing.module.css'

// Halaman depan untuk calon pengguna. Terbuka tanpa login hanya di alamat "/" persis (middleware.ts);
// yang sudah login langsung diarahkan ke Dashboard. Keputusan desain: docs/design/halaman/landing.md.
export const metadata: Metadata = {
  title: 'SIMO - Sistem Informasi Manajemen Persediaan Obat',
  description:
    'SIMO membantu apotek mencatat stok obat, memberi tahu kapan dan berapa banyak obat harus dipesan ulang (ROP dan EOQ), dan mengingatkan obat yang mendekati kedaluwarsa.',
  openGraph: {
    title: 'SIMO - Stok obat apotek, selalu tepat waktu',
    description: 'Tahu kapan harus pesan ulang, berapa banyak, dan obat mana yang mendekati kedaluwarsa. Cukup lewat browser.',
    type: 'website',
    locale: 'id_ID',
    images: [{ url: '/landing/dashboard.webp', width: 2880, height: 1800, alt: 'Dashboard SIMO' }],
  },
}

export default function HalamanDepan() {
  return (
    <div id="isi" className={cn('min-h-full pb-0', gaya.akar, hurufSerif.variable)}>
      <a
        href="#konten"
        className="sr-only z-[60] rounded-full bg-card px-5 py-3 font-medium text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:ring-2 focus:ring-ring"
      >
        Lewati ke isi
      </a>
      <Navbar />
      <main id="konten">
        <BagianPembuka />
        <BagianPernyataan />
        <BagianFitur />
        <BagianDetail />
        <BagianDemo />
        <BagianCaraKerja />
        <BagianTanyaJawab />
        <BagianAjakan />
      </main>
      <Footer />
    </div>
  )
}
