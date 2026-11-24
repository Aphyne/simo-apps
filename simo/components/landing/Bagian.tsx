import type { CSSProperties, ReactNode } from 'react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Play, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DURASI_DEMO } from '@/lib/landing'
import { URL_MASUK } from '@/lib/domain'
import { Logo, TAUTAN_BAGIAN } from './Logo'
import VideoDemo from './VideoDemo'
import gaya from './landing.module.css'
import fotoDashboard from '@/public/landing/dashboard.webp'
import fotoReorder from '@/public/landing/reorder.webp'
import fotoDetail from '@/public/landing/detail.webp'
import fotoStokMasuk from '@/public/landing/stok-masuk.webp'
import fotoLaporan from '@/public/landing/laporan.webp'
import fotoNotifikasi from '@/public/landing/notifikasi.webp'
import fotoHp from '@/public/landing/hp-dashboard.webp'

// Semua foto produk = tangkapan layar SIMO asli dengan data contoh fiktif (nama apotek dan orang fiktif).

const WADAH = 'mx-auto w-full max-w-6xl px-5 sm:px-8'

function Miring({ children }: { children: ReactNode }) {
  return <em className="italic">{children}</em>
}

function Label({ children, gelap }: { children: ReactNode; gelap?: boolean }) {
  return <p className={cn('text-sm font-medium', gelap ? 'text-[var(--biru-muda)]' : 'text-primary')}>{children}</p>
}

function TombolMasuk({ besar, gelap, className }: { besar?: boolean; gelap?: boolean; className?: string }) {
  return (
    <Link
      href={URL_MASUK}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full font-semibold outline-none transition-colors focus-visible:ring-4',
        besar ? 'h-13 px-7 text-base' : 'h-11 px-5 text-sm',
        gelap
          ? 'bg-white text-[var(--tinta)] hover:bg-white/90 focus-visible:ring-white/40'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/40',
        className
      )}
    >
      Masuk ke SIMO
      <ArrowRight className="size-4 motion-safe:transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

// Potongan foto: menampilkan sebagian tangkapan layar (lebar L%, digeser x0/y0 = pecahan lebar/tinggi foto).
function Potongan({ foto, L, x0, y0, sizes }: { foto: StaticImageData; L: number; x0: number; y0: number; sizes: string }) {
  const posisi: CSSProperties = { width: `${L}%`, left: `-${x0 * L}%`, top: `-${y0 * L}%` }
  return (
    <div className="absolute" style={posisi}>
      <Image src={foto} alt="" sizes={sizes} className="h-auto w-full" />
    </div>
  )
}

// ---------- 1. Pembuka ----------

export function BagianPembuka() {
  const urut = (i: number) => ({ '--i': i }) as CSSProperties
  return (
    <section data-panggung aria-labelledby="judul-utama" className={cn(gaya.panggung, 'mx-2 mt-2 rounded-[2rem] sm:mx-3 sm:mt-3')}>
      <div className={gaya.butir} aria-hidden="true" />
      <div className={cn(WADAH, 'pt-32 text-center sm:pt-40')}>
        <p style={urut(0)} className={cn(gaya.masuk, 'mx-auto inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm text-white/80 ring-1 ring-white/15')}>
          <span className="size-1.5 rounded-full bg-[var(--biru-muda)]" aria-hidden="true" />
          Sistem persediaan obat untuk apotek
        </p>
        <h1 id="judul-utama" style={urut(1)} className={cn(gaya.masuk, gaya.serif, 'mx-auto mt-7 max-w-5xl text-[clamp(2.75rem,7.4vw,6.6rem)] leading-[0.95] text-balance')}>
          Stok obat apotek, <Miring><span className="text-[var(--biru-muda)]">selalu</span></Miring> tepat waktu.
        </h1>
        <p style={urut(2)} className={cn(gaya.masuk, 'mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-white/70 sm:text-xl')}>
          SIMO memberi tahu kapan obat harus dipesan ulang dan berapa banyak, mengingatkan yang hampir kedaluwarsa,
          dan merapikan catatan stok masuk dan keluar di satu tempat.
        </p>
        <div style={urut(3)} className={cn(gaya.masuk, 'mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row')}>
          <TombolMasuk besar gelap className="w-full sm:w-auto" />
          <a
            href="#demo"
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-white/[0.07] px-7 text-base font-medium text-white ring-1 ring-white/20 outline-none backdrop-blur-md transition-colors hover:bg-white/[0.12] focus-visible:ring-4 focus-visible:ring-white/40 sm:w-auto"
          >
            <Play className="size-4 fill-current" aria-hidden="true" />
            Tonton demo
          </a>
        </div>
        <ul style={urut(4)} className={cn(gaya.masuk, 'mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/55')}>
          {['Tanpa instalasi', 'Bisa di HP dan komputer', 'Akun admin dan staf'].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-[var(--biru-muda)]" aria-hidden="true" />{t}</li>
          ))}
        </ul>
      </div>

      <div style={urut(5)} className={cn(gaya.masuk, 'relative mx-auto mt-16 max-w-6xl px-4 sm:mt-20 sm:px-8')}>
        <div className={gaya.miring}>
          <div className={gaya.bingkai}>
            <Image
              src={fotoDashboard}
              alt="Dashboard SIMO: ubin Perlu reorder, pendapatan hari ini, obat akan kedaluwarsa, dan aktivitas hari ini"
              priority
              sizes="(min-width: 1200px) 1120px, 95vw"
              className="h-auto w-full rounded-[0.9rem]"
            />
          </div>
        </div>
        <div className={cn(gaya.bingkaiTerang, 'absolute -right-2 bottom-[18%] z-10 hidden w-[17rem] overflow-hidden rounded-2xl bg-white md:block lg:-right-6 lg:w-[19rem]')}>
          <Image src={fotoNotifikasi} alt="Notifikasi: tiga obat perlu dipesan ulang, satu sudah habis" sizes="304px" className="h-auto w-full" />
        </div>
      </div>
      {/* bagian bawah foto melebur ke panggung */}
      <div aria-hidden="true" className="pointer-events-none relative -mt-40 h-40 bg-gradient-to-t from-[var(--tinta)] to-transparent sm:-mt-56 sm:h-56" />
    </section>
  )
}

// ---------- 2. Pernyataan masalah ----------

const MASALAH = [
  { judul: 'Stok habis saat dicari pembeli', isi: 'Obat baru ketahuan habis ketika ada yang membeli, dan pembeli pulang dengan tangan kosong.' },
  { judul: 'Obat kedaluwarsa terbuang', isi: 'Tanggal expired tercatat di kertas atau kemasan, lalu terlewat sampai obatnya tidak bisa dijual.' },
  { judul: 'Pesan terlalu banyak atau terlalu sedikit', isi: 'Jumlah pesanan ditebak. Modal tertahan di gudang, atau stok cepat habis lagi.' },
] as const

export function BagianPernyataan() {
  return (
    <section aria-labelledby="judul-pernyataan" className="py-24 sm:py-32">
      <div className={WADAH}>
        <Label>Kenapa SIMO</Label>
        <h2 id="judul-pernyataan" className={cn(gaya.serif, gaya.muncul, 'mt-4 max-w-5xl text-[clamp(2.1rem,4.6vw,4rem)] leading-[1.05] text-balance text-foreground')}>
          Apotek tidak seharusnya <Miring>menebak</Miring> kapan stok habis,{' '}
          <span className="text-muted-foreground">berapa yang harus dipesan, atau obat mana yang hampir kedaluwarsa.</span>
        </h2>
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {MASALAH.map((m, i) => (
            <li key={m.judul} className={cn(gaya.muncul, 'border-t border-foreground/15 pt-6')}>
              <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{m.judul}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{m.isi}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------- 3. Fitur (berselang-seling) ----------

const FITUR = [
  {
    label: 'Pesan ulang', judul: <>Tahu <Miring>kapan</Miring> harus memesan.</>,
    isi: 'Setiap obat punya titik pesan ulang (ROP) yang dihitung dari penjualannya. Begitu stok menyentuh batas itu, Dashboard dan lonceng langsung memberi tahu.',
    poin: ['Status Habis, Harus reorder, dan Mendekati ROP', 'Keranjang pesanan dikelompokkan per supplier', 'Surat Pesanan PDF, atau kirim lewat WhatsApp'],
    foto: fotoReorder, alt: 'Halaman Reorder SIMO: daftar obat yang perlu dipesan dan keranjang per supplier', L: 126, x0: 0.195, y0: 0.18,
  },
  {
    label: 'Jumlah pesan', judul: <>Berapa banyak? <Miring>Sudah dihitung.</Miring></>,
    isi: 'Metode EOQ memberi jumlah sekali pesan dengan biaya pesan dan biaya simpan paling hemat, lengkap dengan stok pengaman dan perkiraan kapan stok habis.',
    poin: ['Rumus dan angka yang dipakai bisa dibuka', 'Dihitung ulang setiap ada transaksi', 'Perkiraan habis dalam hitungan hari'],
    foto: fotoDetail, alt: 'Detail obat di SIMO: stok saat ini, titik pesan ulang, dan jumlah sekali pesan (EOQ)', L: 126, x0: 0.195, y0: 0.235,
  },
  {
    label: 'Stok masuk dan keluar', judul: <>Setiap obat <Miring>masuk dan keluar</Miring> tercatat.</>,
    isi: 'Catat obat dari faktur supplier lengkap dengan batch dan tanggal expired. Penjualan langsung mengurangi stok dan menjadi pendapatan hari itu.',
    poin: ['Faktur, batch, dan tanggal expired', 'Penjualan otomatis menjadi pendapatan', 'Tren pembelian per bulan'],
    foto: fotoStokMasuk, alt: 'Halaman Stok masuk SIMO: pembelian bulan ini, tren stok masuk, dan masuk per obat', L: 126, x0: 0.195, y0: 0.06,
  },
  {
    label: 'Laporan', judul: <>Laporan yang <Miring>siap dicetak.</Miring></>,
    isi: 'Stok obat, kartu stok per obat, stok masuk, stok keluar, dan kedaluwarsa. Pratinjau dulu, lalu unduh sebagai PDF atau Excel.',
    poin: ['Lima jenis laporan dalam satu halaman', 'Pratinjau sebelum mengunduh', 'PDF dan Excel'],
    foto: fotoLaporan, alt: 'Halaman Laporan SIMO: nilai persediaan, stok habis, dan tabel laporan stok obat', L: 126, x0: 0.195, y0: 0.06,
  },
]

export function BagianFitur() {
  return (
    <section id="fitur" aria-labelledby="judul-fitur" className="scroll-mt-24 pb-12">
      <div className={WADAH}>
        <div className="max-w-3xl">
          <Label>Fitur</Label>
          <h2 id="judul-fitur" className={cn(gaya.serif, 'mt-4 text-[clamp(2.1rem,4.6vw,4rem)] leading-[1.05] text-balance text-foreground')}>
            Semua alur stok, <Miring>dalam satu tempat.</Miring>
          </h2>
        </div>
        <div className="mt-16 space-y-24 sm:mt-20 sm:space-y-32">
          {FITUR.map((f, i) => (
            <article key={f.label} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
              <div className={cn('lg:col-span-5', i % 2 === 1 && 'lg:order-2')}>
                <p className="font-mono text-sm text-muted-foreground">0{i + 1} <span className="font-sans font-medium text-primary">· {f.label}</span></p>
                <h3 className={cn(gaya.serif, 'mt-3 text-4xl leading-[1.05] text-foreground sm:text-5xl')}>{f.judul}</h3>
                <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">{f.isi}</p>
                <ul className="mt-7 space-y-3">
                  {f.poin.map((p) => (
                    <li key={p} className="flex gap-3 text-foreground">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <figure className={cn(gaya.muncul, 'lg:col-span-7', i % 2 === 1 && 'lg:order-1')}>
                <div className="rounded-[1.75rem] bg-[var(--rona)] p-3 sm:p-6">
                  <div className={cn(gaya.bingkaiTerang, 'relative aspect-[16/11] overflow-hidden bg-background')}>
                    <Potongan foto={f.foto} L={f.L} x0={f.x0} y0={f.y0} sizes="(min-width: 1024px) 860px, 120vw" />
                  </div>
                </div>
                <figcaption className="sr-only">{f.alt}</figcaption>
              </figure>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- 4. Detail kecil (bento) ----------

export function BagianDetail() {
  return (
    <section aria-labelledby="judul-detail" className="py-24 sm:py-32">
      <div className={WADAH}>
        <div className="max-w-3xl">
          <Label>Sehari-hari</Label>
          <h2 id="judul-detail" className={cn(gaya.serif, 'mt-4 text-[clamp(2.1rem,4.6vw,4rem)] leading-[1.05] text-balance text-foreground')}>
            Detail kecil yang <Miring>terasa setiap hari.</Miring>
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <div className={cn(gaya.muncul, 'relative flex flex-col overflow-hidden rounded-[1.75rem] bg-[var(--rona)] px-7 pt-8 md:col-span-3 md:row-span-2')}>
            <h3 className="text-xl font-semibold text-foreground">Rapi di HP</h3>
            <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">Tampilan menyesuaikan layar. Cek stok dari mana saja, tanpa memasang aplikasi.</p>
            <div className="relative mx-auto mt-10 w-[15.5rem] rounded-t-[2.6rem] md:mt-auto bg-[var(--tinta)] px-2.5 pt-2.5 shadow-[0_30px_80px_-20px_rgb(15_23_42/0.45)] sm:w-[17rem]">
              <div className="relative aspect-[390/600] md:aspect-[390/700] overflow-hidden rounded-t-[2.1rem] bg-background">
                <Image src={fotoHp} alt="Dashboard SIMO di layar HP" sizes="272px" className="h-auto w-full" />
              </div>
            </div>
          </div>
          <div className={cn(gaya.muncul, 'relative overflow-hidden rounded-[1.75rem] bg-card p-7 sm:p-8 md:col-span-3')}>
            <h3 className="text-xl font-semibold text-foreground">Lonceng yang mengingatkan</h3>
            <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">Obat yang perlu dipesan, diurutkan dari yang paling mendesak.</p>
            <div className={cn(gaya.bingkaiTerang, 'relative -mb-28 ml-auto mt-7 w-[88%] max-w-[22rem] overflow-hidden rounded-2xl bg-white')}>
              <Image src={fotoNotifikasi} alt="Panel notifikasi SIMO berisi tiga obat yang perlu dipesan ulang" sizes="352px" className="h-auto w-full" />
            </div>
          </div>
          <div className={cn(gaya.muncul, 'rounded-[1.75rem] bg-card p-7 sm:p-8 md:col-span-3')}>
            <h3 className="text-xl font-semibold text-foreground">Admin dan staf, hak berbeda</h3>
            <dl className="mt-5 divide-y divide-border border-y border-border">
              <div className="flex gap-4 py-4">
                <dt className="w-16 shrink-0 font-semibold text-foreground">Admin</dt>
                <dd className="text-muted-foreground">Mengatur obat, supplier, pemesanan, laporan, dan akun.</dd>
              </div>
              <div className="flex gap-4 py-4">
                <dt className="w-16 shrink-0 font-semibold text-foreground">Staf</dt>
                <dd className="text-muted-foreground">Mencatat stok masuk dan keluar, tanpa melihat angka uang.</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">Masuk dengan username, atau akun Google yang didaftarkan admin.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- 5. Demo ----------

export function BagianDemo() {
  return (
    <section id="demo" data-panggung aria-labelledby="judul-demo" className={cn(gaya.panggung, 'mx-2 scroll-mt-4 rounded-[2rem] py-24 sm:mx-3 sm:py-32')}>
      <div className={gaya.butir} aria-hidden="true" />
      <div className={cn(WADAH, 'text-center')}>
        <Label gelap>Demo</Label>
        <h2 id="judul-demo" className={cn(gaya.serif, 'mx-auto mt-4 max-w-4xl text-[clamp(2.1rem,4.8vw,4.2rem)] leading-[1.05] text-balance')}>
          Lihat SIMO bekerja, <Miring><span className="text-[var(--biru-muda)]">{DURASI_DEMO}</span></Miring> saja.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-white/65">
          Enam alur berurutan: masuk, membaca Dashboard, menambah obat, menambah supplier, mencatat stok masuk, dan mencatat stok keluar.
        </p>
        <div className={cn(gaya.muncul, 'mx-auto mt-14 max-w-5xl text-left')}>
          <VideoDemo />
        </div>
      </div>
    </section>
  )
}

// ---------- 6. Cara kerja ----------

const LANGKAH = [
  { judul: 'Catat stok masuk dan keluar', isi: 'Obat datang dicatat dari faktur supplier; obat terjual dicatat di stok keluar. Cukup beberapa klik.' },
  { judul: 'SIMO menghitung otomatis', isi: 'Dari penjualan 30 hari terakhir dan lama pengiriman supplier, SIMO menghitung titik pesan ulang dan jumlah pesan.' },
  { judul: 'Pesan tepat waktu', isi: 'Dashboard dan lonceng memberi tahu obat yang perlu dipesan, lengkap dengan saran jumlah dan Surat Pesanannya.' },
] as const

export function BagianCaraKerja() {
  return (
    <section id="cara-kerja" aria-labelledby="judul-cara-kerja" className="scroll-mt-24 py-24 sm:py-32">
      <div className={WADAH}>
        <div className="max-w-3xl">
          <Label>Cara kerja</Label>
          <h2 id="judul-cara-kerja" className={cn(gaya.serif, 'mt-4 text-[clamp(2.1rem,4.6vw,4rem)] leading-[1.05] text-balance text-foreground')}>
            Tiga langkah, <Miring>setiap hari.</Miring>
          </h2>
        </div>
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className={cn(gaya.muncul, 'border-t border-foreground/15 pt-6')}>
              <span className={cn(gaya.serif, 'block text-7xl leading-none text-primary')} aria-hidden="true">{i + 1}</span>
              <h3 className="mt-6 text-lg font-semibold text-foreground"><span className="sr-only">Langkah {i + 1}: </span>{l.judul}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{l.isi}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------- 7. Tanya jawab ----------

const TANYA = [
  { t: 'Apa itu SIMO?', j: 'SIMO (Sistem Informasi Manajemen Persediaan Obat) membantu apotek mencatat stok obat dan memberi tahu kapan serta berapa banyak obat harus dipesan ulang.' },
  { t: 'Apakah perlu memasang aplikasi?', j: 'Tidak. SIMO dibuka lewat browser di komputer atau HP. Cukup masuk dengan akun Anda.' },
  { t: 'Apa itu ROP dan EOQ?', j: 'ROP (titik pesan ulang) adalah batas stok untuk mulai memesan, supaya obat tidak habis sebelum pesanan datang. EOQ adalah jumlah sekali pesan yang membuat biaya pesan dan biaya simpan paling hemat. Keduanya dihitung otomatis, dan rumus serta angkanya bisa dilihat di halaman detail obat.' },
  { t: 'Dari mana SIMO tahu obat harus dipesan?', j: 'Dari rata-rata penjualan obat itu dalam 30 hari terakhir, lama pengiriman supplier, dan stok pengaman. Semakin rutin stok keluar dicatat, semakin tepat perhitungannya.' },
  { t: 'Siapa saja yang bisa memakai SIMO?', j: 'Admin (pemilik atau apoteker) mengatur obat, supplier, pemesanan, laporan, dan akun. Staf mencatat stok masuk dan stok keluar, tanpa melihat angka uang.' },
  { t: 'Bagaimana cara mendapatkan akun?', j: 'Akun dibuat oleh admin apotek dari halaman Manajemen User. Setelah itu masuk dengan username dan password, atau dengan akun Google yang sudah didaftarkan admin.' },
  { t: 'Apakah laporan bisa dicetak?', j: 'Bisa. Laporan stok, kartu stok, stok masuk, stok keluar, dan kedaluwarsa bisa dipratinjau lalu diunduh sebagai PDF atau Excel.' },
] as const

export function BagianTanyaJawab() {
  return (
    <section id="tanya-jawab" aria-labelledby="judul-tanya" className="scroll-mt-24 pb-24 sm:pb-32">
      <div className={cn(WADAH, 'grid gap-12 lg:grid-cols-[1fr_1.45fr] lg:gap-20')}>
        <div>
          <Label>Tanya jawab</Label>
          <h2 id="judul-tanya" className={cn(gaya.serif, 'mt-4 text-[clamp(2.1rem,4.2vw,3.6rem)] leading-[1.05] text-balance text-foreground')}>
            Pertanyaan yang <Miring>sering muncul.</Miring>
          </h2>
          <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">Belum menemukan jawabannya? Tanyakan pada admin apotek Anda.</p>
        </div>
        <div className="border-t border-foreground/15">
          {TANYA.map((q) => (
            <details key={q.t} className="group border-b border-foreground/15">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {q.t}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-foreground/15 transition-colors group-open:bg-foreground group-open:text-background">
                  <Plus className="size-4 motion-safe:transition-transform group-open:rotate-45" aria-hidden="true" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-12 leading-relaxed text-muted-foreground">{q.j}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- 8. Ajakan penutup ----------

export function BagianAjakan() {
  return (
    <section data-panggung aria-labelledby="judul-ajakan" className={cn(gaya.panggung, 'mx-2 rounded-[2rem] py-24 text-center sm:mx-3 sm:py-36')}>
      <div className={gaya.butir} aria-hidden="true" />
      <div className={WADAH}>
        <h2 id="judul-ajakan" className={cn(gaya.serif, gaya.muncul, 'mx-auto max-w-4xl text-[clamp(2.5rem,6vw,5.4rem)] leading-[1] text-balance')}>
          Stok yang rapi dimulai <Miring><span className="text-[var(--biru-muda)]">hari ini.</span></Miring>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/65">Masuk dengan akun yang diberikan admin apotek Anda.</p>
        <TombolMasuk besar gelap className="mt-10" />
      </div>
    </section>
  )
}

// ---------- 9. Footer ----------

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-16">
      <div className={cn(WADAH, 'flex flex-col gap-8 md:flex-row md:items-start md:justify-between')}>
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">Sistem Informasi Manajemen Persediaan Obat untuk apotek.</p>
        </div>
        <nav aria-label="Tautan kaki halaman">
          <ul className="flex flex-wrap gap-x-1 gap-y-1">
            {TAUTAN_BAGIAN.map((t) => (
              <li key={t.href}>
                <a href={t.href} className="inline-flex h-11 items-center rounded-full px-3 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">{t.label}</a>
              </li>
            ))}
            <li>
              <a href="/design" className="inline-flex h-11 items-center rounded-full px-3 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Panduan desain</a>
            </li>
            <li>
              <Link href={URL_MASUK} className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">Masuk</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className={cn(WADAH, 'mt-10 flex justify-between border-t border-foreground/10 py-6 text-sm text-muted-foreground')}>
        <p>© 2026 SIMO</p>
        <a href="#isi" className="rounded-full outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Kembali ke atas</a>
      </div>
      <p aria-hidden="true" className={cn(gaya.serif, 'pointer-events-none -mb-[0.22em] select-none text-center text-[clamp(7rem,30vw,26rem)] leading-[0.8] text-foreground/[0.05]')}>
        SIMO
      </p>
    </footer>
  )
}
