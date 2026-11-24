# Halaman depan (landing page)

Bagian dari [`docs/DESIGN.md`](../../DESIGN.md). Berkas ini memuat keputusan khusus halaman depan; aplikasi (setelah login) tetap mengikuti DESIGN.md.

**Halaman depan (24 Nov 2026, versi 2)**: rute `/` (`simo/app/page.tsx`, komponen di `simo/components/landing/`). Penonton: **calon pengguna** apotek. Versi 1 (ilustrasi dari kode, gaya aplikasi) ditolak Boss karena "AI banget"; versi 2 dibuat dengan skill `ui-ux-pro-max` atas izin Boss, **tanpa terikat aturan visual aplikasi** (arahan Boss: "gausa dibatasin").

## Bahasa visual (khusus halaman depan)
- **Editorial + Bento** (hasil skill): judul **Instrument Serif** (`components/landing/huruf.ts`, next/font, di-host sendiri) dengan kata miring sebagai aksen; teks isi tetap Figtree. Acuan: video referensi Boss "Nepalonia".
- **Panggung gelap** (`.panggung` di `landing.module.css`): navy pekat dengan cahaya biru dari atas, kisi halus yang memudar, dan butiran (noise); dipakai untuk pembuka, demo, dan ajakan penutup, sebagai kartu bersudut 2rem di dalam halaman. Gradasi dan bayangan dipakai di sini (pengecualian dari DESIGN.md 1.4 dan aturan wajib 10, atas arahan Boss). Warna turunan token SIMO (`--primary`, `--foreground`, `--background`); aksen miring `--biru-muda` di atas navy (kontras > 9:1).
- **Navbar pil kaca mengambang** (permintaan Boss): `fixed`, pil `backdrop-filter: blur(18px) saturate(1.6)`. Di atas elemen `data-panggung` memakai kaca gelap (teks putih, tombol putih), selebihnya kaca terang (tombol biru). Di HP: tombol menu 44px membuka panel kaca yang sama, Esc menutup.
- **Foto produk asli**, bukan ilustrasi: tangkapan layar SIMO di `simo/public/landing/*.webp` (Dashboard, Reorder, detail obat, Stok masuk, Laporan, notifikasi, Dashboard HP). Diambil dari Postgres lokal dengan data contoh fiktif; nama apotek di header diganti "Apotek Sehat Bersama" dan nama orang fiktif (Sari Apoteker). Fitur memakai `Potongan` (bagian foto diperbesar dan digeser) di dalam panel `--rona`.

## Isi (urutan)
Pembuka (judul serif, dua tombol, foto Dashboard miring yang tegak saat digulir, foto notifikasi melayang) -> Pernyataan masalah (kalimat serif besar + tiga masalah bernomor bergaris atas, tanpa ikon) -> Fitur berselang-seling kiri-kanan (Pesan ulang, Jumlah pesan, Stok masuk dan keluar, Laporan) -> Bento "Detail kecil" (HP, lonceng, peran admin dan staf) -> Demo (panggung gelap) -> Cara kerja (angka serif besar 1-2-3) -> Tanya jawab (garis tipis, tombol plus) -> Ajakan penutup (panggung gelap) -> Footer (kata "SIMO" serif raksasa samar).
Keputusan Boss: tombol utama hanya **"Masuk ke SIMO"** (`/login`); tanpa testimoni, tanpa harga, nama apotek asli tidak disebut; semua fitur yang disebut ada di aplikasi.

## Video demo
`VideoDemo.tsx`, pengaturan `simo/lib/landing.ts` (`YOUTUBE_ID_DEMO`). Kosong: sampul foto Dashboard buram + "Video demo segera hadir". Terisi: pola fasad (sampul YouTube + tombol putar; iframe `youtube-nocookie.com` dengan subtitle baru dimuat setelah diklik). CSP `next.config.ts` mengizinkan `www.youtube-nocookie.com` (frame) dan `i.ytimg.com` (gambar).

## Akses dan gerak
- `middleware.ts`: hanya `/` persis terbuka tanpa login; yang sudah login (cookie `simo_token`) diarahkan ke `/dashboard`.
- Gerak (CSS saja, tanpa pustaka): teks pembuka masuk berurutan dari blur; bagian muncul saat digulir dan foto pembuka menegak (`animation-timeline: view()`). Semua di dalam `prefers-reduced-motion: no-preference`; tanpa dukungan atau dengan gerak dikurangi, isi langsung utuh. Tanpa parallax dan scroll-jacking.
- Aksesibilitas: "Lewati ke isi", target sentuh 44px di navbar dan footer, `<details>` bawaan untuk tanya jawab, `aria-labelledby` per bagian, foto produk ber-alt (foto di bento/potongan dijelaskan lewat figcaption sr-only).
