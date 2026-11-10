# DESIGN — Sumber Tunggal Design System SIMO

Versi 1.0 · 10 Nov 2026 · Spesifikasi: `docs/spec/design-system.md` · Penunjuk untuk agent: `docs/FE-AGENT.md`

Dokumen ini satu-satunya panduan desain SIMO (Sistem Informasi Manajemen Persediaan Obat, Apotek Rezky Medika). Ia berisi **nama dan peran** token, aturan pemakaian, dan daftar penyimpangan yang diketahui. **Nilai warna tidak ditulis di sini**: nilai hanya ada di `simo/app/globals.css` (kecuali tabel rasio kontras WCAG di 2.2, yang berupa angka rasio, bukan nilai warna).

## 0. Tujuan dan alur

Alur satu arah: **token (`simo/app/globals.css`) → halaman `/design` → `docs/DESIGN.md`**.
1. `globals.css` menyimpan nilai. Komponen hanya memakai kelas token (`bg-brand-600`, `text-fg-muted`, `border-line`).
2. Halaman `/design` (jalur: `simo/app/design/`, rute `/design`) memperlihatkan token dan komponen secara visual. Hanya superadmin di produksi; bebas tanpa login di mode pengembangan. Di produksi: tanpa login diarahkan ke `/login`, admin/staf ke `/dashboard` (dijaga `middleware.ts` dan `simo/components/layout/SuperadminOnly.tsx`; guard sisi klien, bukan keamanan data).
3. Dokumen ini menjelaskan aturan dan peran. Bila bertentangan dengan `globals.css`, `globals.css` yang benar.

Tujuan praktis: mengubah tampilan cukup dengan mengubah nilai token (lihat 3).

### Aturan wajib untuk agent dan pengembang
1. Baca dokumen ini penuh sebelum menyentuh UI.
2. Hanya ubah tampilan (JSX + kelas). **Jangan ubah** logic, hooks, fetch, API, validasi, types.
3. Dilarang memakai skill atau desain eksternal tanpa izin eksplisit Boss (lihat 7).
4. Implementasi bertahap: satu halaman selesai dan di-acc Boss, baru halaman berikutnya; setelah di-acc, perbarui Progres (bagian 6).
5. Warna di kelas memakai **token** (bagian 1). Jangan hex di JSX/CSS. Jangan kelas warna lama (`bg-blue-600`, `text-gray-500`, ...) pada kode baru. Butuh warna baru: tambahkan token di `globals.css` dulu, lalu pakai.
6. Patuhi WCAG 2.1 AA (2.2) dan hitung rasio untuk warna teks baru.
7. Font Inter; jangan diganti tanpa alasan kuat.
8. Konsisten dengan halaman yang sudah selesai; pakai ulang komponen sebelum membuat baru.
9. Dua kelas warna untuk utilitas yang sama pada satu elemen: wajib cek (lihat 4).

## 1. Token (nama dan peran)

Semua token ada di dua blok `@theme inline` di `simo/app/globals.css`. Token semantik SIMO adalah alias ke skala warna bawaan Tailwind (nilai identik dengan tampilan sebelum migrasi).

### 1.1 Token semantik SIMO (dipakai halaman dan komponen fitur)

| Token (kelas contoh) | Alias ke | Peran |
|---|---|---|
| `brand-50..900` (`bg-brand-600`, `ring-brand-500`) | skala blue | Aksen utama: tombol primer, nav aktif, cincin fokus, tautan, tint ikon. 600 = isi pekat; 500 = fokus input; 700 = hover; 50/100 = tint |
| `danger-50..900` | skala red | Error, stok kritis, hapus. 600 untuk teks error; 100 untuk badge |
| `success-50..900` | skala emerald | Aman, sukses. 700 untuk teks data hijau; 100 untuk badge |
| `warning-50..900` | skala orange | Mendekati ROP/kedaluwarsa, peringatan. 700 untuk teks; 100 untuk badge |
| `fg` | gray-900 | Judul, angka utama |
| `fg-secondary` | gray-700 | Label form, sel tabel, judul kartu |
| `fg-tertiary` | gray-600 | Teks isi |
| `fg-muted` | gray-500 | Sublabel, caption, placeholder (teks yang dibaca; lolos AA) |
| `fg-subtle` | gray-400 | **Hanya ikon dan elemen non-teks** (tidak lolos AA untuk teks) |
| `fg-inverse` | white | Teks di atas warna pekat |
| `surface` | white | Kartu, panel, input |
| `surface-subtle` | gray-50 | Latar halaman, hover baris, header tabel |
| `surface-muted` | gray-100 | Hover netral, skeleton, chip, latar ikon netral |
| `line` | gray-200 | Border kartu, tabel, pemisah |
| `line-subtle` | gray-100 | Pemisah baris halus |
| `line-strong` | gray-300 | Border input dan tombol sekunder |

Catatan peran:
- Aksen "ungu" tidak punya token (nama `accent` bentrok dengan shadcn). Lihat 5.
- `brand-500` dalam praktik berperan sebagai "cincin fokus brand" (dipakai berpasangan `ring-brand-500` + `border-brand-500`).

### 1.2 Token shadcn (hanya untuk `simo/components/ui/` bawaan shadcn)

`background, foreground, card(-foreground), popover(-foreground), primary(-foreground), secondary(-foreground), muted(-foreground), accent(-foreground), destructive, border, input, ring, chart-1..5, sidebar-*`. Skala **netral** tanpa rona, terpisah dari token SIMO. Jangan dipakai di halaman atau komponen fitur; jangan disamakan dengan `line`/`surface` (nilainya berbeda).

### 1.3 Radius dan font
- `--radius` = 0.625rem. Turunan: `rounded-sm` 6px, `md` 8px, `lg` 10px, `xl` 14px, `2xl` 18px, `3xl` 22px, `4xl` 26px (dihitung dari `globals.css`, belum diukur di browser). Pola: tombol/input `rounded-lg`, kartu/panel `rounded-xl`, badge `rounded-full`.
- Font: `--font-sans` dan `--font-heading` = Inter (`next/font`). Mono: stack default Tailwind (`font-mono`).

### 1.4 Elevasi
`shadow-sm` untuk kartu dan panel (dominan); `shadow-md` kartu login dan dropdown; `shadow-lg` overlay. Tidak ada shadow warna.

## 2. Prinsip dan aksesibilitas

### 2.1 Prinsip
- Bersih dan minimal; setiap elemen punya tujuan.
- Dominan putih: kartu dan panel `bg-surface`, latar halaman `bg-surface-subtle`.
- Warna aksen hanya pada ikon, badge, status; bukan latar besar.
- Hierarki: info utama besar dan tebal; sekunder kecil dan `fg-muted`.
- UX jelas: label terang, status mudah dibaca, aksi utama mudah ditemukan.

### 2.2 Kontras WCAG 2.1 AA (wajib)
Teks yang dibaca harus rasio kontras **>= 4,5:1**. Karakter mirip (I/l/1, O/0) dan kontras rendah berisiko salah baca dosis, batch, atau tanggal kedaluwarsa. Rasio di bawah dihitung terhadap latar putih (formula WCAG 2.1, luminansi relatif). Kolom "token pengganti" memakai nama token SIMO.

| Warna gagal AA untuk teks (rasio) | Pengganti (rasio) | Kapan |
|---|---|---|
| gray-400 = `fg-subtle` (2,54) | gray-500 = `fg-muted` (4,83) | Setiap teks yang dibaca: label, caption, pesan kosong/error, prefix satuan |
| red-500 = `danger-500` (3,76) | red-600 = `danger-600` (4,83) | Teks error validasi, peringatan data |
| emerald-600 = `success-600` (3,77) | emerald-700 = `success-700` (5,48) | Angka/teks data hijau |
| orange-500 (2,80) / orange-600 (3,56) = `warning-500/600` | orange-700 = `warning-700` (5,18) | Teks oranye: kedua shade gagal, hanya 700 lolos |
| yellow-500 (1,92) / yellow-600 (2,94) | yellow-700 (4,92) | Teks kuning (tanpa token; lihat 5) |
| blue-500 = `brand-500` (3,68) | blue-600 = `brand-600` (5,17) | Teks/tautan biru |

Hitung rasio dulu untuk warna baru; jangan menganggap "shade 600 pasti aman" (orange-600 dan emerald-600 sama-sama gagal).

Dikecualikan (tetap boleh warna lebih terang): ikon di dalam lingkaran berlatar tint; ikon murni tanpa teks (ikon pencarian, tombol ikon, elipsis paginasi); badge/angka langkah 1-2 karakter di lingkaran kecil; state `disabled` (WCAG 1.4.3). Pengecualian "large text" (>= 18px, atau >= 14px tebal; ambang 3:1) hampir tidak pernah berlaku karena teks data umumnya `text-xs`/`text-sm`; jangan menganggap `font-bold` otomatis lolos. Rujukan penerapan: `/barang-masuk`.

## 3. Cara mengubah tampilan

Ubah satu baris di `simo/app/globals.css`, misalnya `--color-brand-600`, dan semua tombol primer, nav aktif, serta teks tautan ikut berubah. Netral diubah lewat `--color-fg-*`, `--color-surface-*`, `--color-line-*`. Setelah mengubah nilai: cek rasio WCAG (2.2) untuk token teks, lihat `/design`, jalankan `npm run build`.

Batas: sumber tunggal ini berlaku untuk **kelas Tailwind**. Hex di grafik (Recharts) dan PDF (`lib/export.ts`) belum ikut (lihat 5).

## 4. Aturan pemakaian dan konflik kelas

- Pakai kelas token; pakai ulang pola komponen di 4.2 sebelum membuat yang baru.
- **Konflik dua warna pada elemen yang sama** (mis. `bg-surface` dan `bg-white`, atau `text-fg-muted` dan `text-gray-500`): urutan menang ditentukan **urutan kelas di stylesheet hasil build** (Tailwind mengurutkan per nama kelas), bukan urutan penulisan di `className`. Bila `tailwind-merge` (`cn()`) tidak menganggap nama lama dan baru satu grup, keduanya bertahan di DOM dan hasilnya tidak dapat ditebak. **Wajib cek** (periksa atribut `class` di browser dan tampilan) setiap kali menimpa warna bawaan komponen lewat `className`. Hasil uji `cn()` dengan token baru (AC-DS-14) belum tercatat di dokumen ini; `lib/utils.ts` tidak memuat `extendTailwindMerge`.
- Jangan campur kelas lama dan token pada elemen yang sama untuk utilitas yang sama.

### 4.1 Layout
- Sidebar: `bg-surface border-r border-line w-64`; nav normal `text-fg-tertiary hover:bg-surface-muted hover:text-fg`; nav aktif `bg-brand-600 text-white` (`text-white` belum bertoken, lihat 5). Di layar `< lg` sidebar menjadi drawer (bukan "collapse md" terpisah).
- Header: `bg-surface border-b border-line h-14 px-6`. Badge peran admin `bg-brand-600 text-white`; staf `bg-surface-muted text-fg-secondary`.
- Area konten: `bg-surface-subtle p-6`. Judul halaman: `text-xl font-bold text-fg`, deskripsi `text-sm text-fg-muted`.

### 4.2 Komponen (pola)
- **Kartu/panel**: `rounded-xl border border-line bg-surface p-5 shadow-sm`; judul `text-sm font-semibold text-fg-secondary mb-4`.
- **Stat card**: kartu di atas, ikon dalam lingkaran `w-11 h-11 rounded-xl` berlatar tint (`*-100`) dengan ikon `*-600`; label `text-xs text-fg-muted font-medium`; nilai `text-2xl font-bold text-fg`; sublabel `text-xs text-fg-muted`. Semua kartu putih; warna hanya di ikon.
- **Tabel**: header `text-xs font-semibold text-fg-muted uppercase tracking-wide`, baris `border-b border-line-subtle hover:bg-surface-subtle transition-colors`, sel `text-sm text-fg-secondary`, teks utama `font-medium text-fg`, kode/tanggal `text-xs text-fg-muted font-mono`.
- **Badge status (pill)** `text-xs font-medium px-2.5 py-0.5 rounded-full`: aman `bg-success-100 text-success-700`; reorder `bg-warning-100 text-warning-700`; kritis `bg-danger-100 text-danger-700`; kedaluwarsa `bg-surface-muted text-fg-muted`; admin `bg-brand-100 text-brand-700`; staf `bg-surface-muted text-fg-tertiary`. Catatan: `StatusBadge` memakai green, bukan success (lihat 5).
- **Tombol**: primer `bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm`; sekunder `border border-line-strong text-fg-secondary hover:bg-surface-subtle`; bahaya `bg-danger-600 hover:bg-danger-700 text-white`; ghost/ikon `text-fg-muted hover:text-fg-secondary hover:bg-surface-muted rounded-lg p-2`.
- **Form**: input `border border-line-strong rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500`; label `text-sm font-medium text-fg-secondary`; error `text-xs text-danger-600`; hint `text-xs text-fg-muted`. Semua input berlabel (`htmlFor`).
- **Skeleton**: `animate-pulse bg-surface-muted rounded-xl`. **Empty state**: `text-center py-10 text-fg-muted text-sm`.
- **Paginasi**: tampil hanya bila `last_page > 1`; teks rentang `text-xs text-fg-muted tabular-nums` (format "a–b dari N entitas"); tombol nomor aktif `bg-brand-600 text-white`. Helper `getPageNumbers` wajib dipakai di semua tabel (pakai yang sudah ada di kode; jangan menulis ulang).
- **Chart container**: sama dengan kartu. Warna grafik masih hex (lihat 5).
- **Format**: pakai helper di `simo/lib/utils.ts` (`formatRupiah`, `formatAngka`, `formatTanggal`, `formatTanggalPendek`, `formatTanggalInput`); angka tabular untuk kolom angka. Jangan memformat manual.
- **Ikon**: Lucide React.
- **Motion**: hanya `transition-colors` (hover/fokus), `animate-pulse` (skeleton), `animate-spin` (spinner), `transition-transform` (chevron), dan animasi dropdown/dialog shadcn. Tanpa animasi dekoratif, tanpa `ease-*` khusus.

## 5. Penyimpangan yang diketahui (jujur, per 10 Nov 2026)

Sisa kelas warna lama setelah migrasi token: **276 kemunculan di 53 berkas** (cacahan `D:\skripsi new\uji-design\cacahan-akhir.txt`, di luar repo). Rinciannya:

1. **Tanpa pemetaan token (118)**: sengaja dibiarkan (spec 3.4) karena mengubah piksel bila diseragamkan.
   - `gray-800` 35 (16 berkas), `gray-300` 10, `gray-200` 4, `gray-400` 3, sisa netral (gray-900/500/50/700) 7;
   - `purple-*` 22 (peran lemah: retur, badge superadmin, kartu "Total Cost"; belum ada nama peran);
   - `green-*` ~14 (`StatusBadge` memakai green, bagian lain emerald: **green dan emerald tidak diseragamkan**);
   - `yellow-*` 5; `black` 7 (overlay modal); `transparent` 8; `white` 2 (mis. nav aktif); varian opacity `white/NN`; `current`;
   - shadcn murni 5 kelas di 11 berkas dilewati (5 termasuk dalam 118).
2. **Konflik kaskade (143 kemunculan; 99 pasangan di 27 berkas)**: nama lama dipertahankan agar tampilan tidak berubah (terbanyak `laporan/page.tsx`, 37 pasangan). Perlu keputusan sebelum nama bisa disatukan.
3. **Teks contoh di `/design`**: 15 kelas contoh sengaja tetap nama lama (ditampilkan sebagai teks); diperbaiki di T-D3.
4. **`--primary` shadcn (= blue-700) tidak sama dengan `brand-600`**: `Button` shadcn tanpa variant tampil lebih gelap dari tombol brand. Tidak diselaraskan (mengubah piksel).
5. **Dua blok `:root` di `globals.css`**: blok pertama (`@layer base`, angka HSL) praktis kode mati, kalah oleh blok kedua (oklch). `--radius` efektif 0.625rem.
6. **Hex di luar token**: grafik Recharts (11 berkas) dan PDF `lib/export.ts` (larik RGB) masih literal. Usulan terpisah.
7. **`prefers-reduced-motion` parsial**: hanya `ObatKategoriChart` menghormatinya (`motion-reduce:`). `animate-pulse`, `animate-spin`, dan transisi lain belum. Perbaikan = usulan terpisah (menyentuh banyak berkas).
8. **Halaman nonaktif**: menu Simulasi, Analisis, Perhitungan dinonaktifkan di Sidebar (dikomentari) meski halamannya ada.

## 6. Progres penataan

Sumber satu-satunya checklist halaman. "Mengikuti" = sudah di-acc Boss menurut checklist lama FE-AGENT, bukan hasil audit baru.

| Halaman | Rute / berkas utama | Status | Catatan |
|---|---|---|---|
| Layout (Sidebar + Header) | `components/layout/*` | Mengikuti | Drawer di `< lg` |
| Dashboard | `/dashboard` | Mengikuti | |
| Data Obat (list, tambah, detail, edit) | `/obat/**` | Mengikuti | 13 kandidat kontras perlu ditinjau |
| Barang Masuk | `/barang-masuk` | Mengikuti | Rujukan WCAG |
| Barang Keluar | `/barang-keluar` | Mengikuti | |
| Monitoring | `/monitoring` | **Belum** | Checklist lama belum dicentang |
| Perhitungan EOQ/ROP | `/perhitungan` | Mengikuti | Hanya admin; menu nonaktif |
| Laporan | `/laporan` | Mengikuti | 37 pasangan konflik kaskade |
| Simulasi | `/simulasi` | Mengikuti | Hanya admin; menu nonaktif |
| Analisis Komparatif | `/analisis` | Mengikuti | Hanya admin; menu nonaktif |
| Supplier (list, tambah, edit) | `/supplier/**` | Mengikuti | |
| Manajemen User | `/users` | Mengikuti | Hanya admin |
| Pengaturan | `/pengaturan` | Mengikuti | Hanya admin |
| Login | `/login` | Mengikuti | |
| Reorder | `/reorder` | Belum tercatat | Tidak ada di checklist lama |
| Pemantauan | `/pemantauan` | Belum tercatat | Hanya superadmin |
| Error / not-found | `app/error.tsx`, `not-found.tsx` | Belum tercatat | |

Hak akses per peran (admin, staf, superadmin) mengikuti aplikasi; UI tidak menjadi sumber keamanan (keamanan di backend).

## 7. Redesign dan referensi

- **Referensi visual**: sebelum redesign, buka dulu gambar di `docs/design-reference/` (17 gambar "Akuris Design System", Okt 2026) sebagai acuan struktur dan pola. Folder itu tidak boleh diubah atau dipindah. Referensi lama (`docs/ui-design-reference/`, Mei 2026) sudah dihapus; pulihkan bila perlu dengan `git checkout 9938725 -- docs/ui-design-reference`.
- **Redesign total** direncanakan Boss. Skill `ui-ux-pro-max` dan `hallmark` **diizinkan eksplisit hanya untuk redesign itu**, dengan syarat: memakai token (bagian 1), membaca dokumen ini dan `docs/FE-AGENT.md`, dan hasilnya mengubah nilai/penamaan token di `globals.css` (bukan hex di komponen). Di luar redesign, skill desain eksternal tetap dilarang tanpa izin Boss. Izin lama yang sudah dipakai: kartu Distribusi Kategori (commit dfc6495).
- **Fase D (komponen bersama)**: rencana, **belum ada**. Tujuannya mengangkat pola di 4.2 menjadi komponen yang dipakai ulang. Sampai ada, pola di 4.2 dipakai sebagai kelas langsung.

## 8. Riwayat dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-11-10 | Pertama (T-D1): menggantikan `FE-AGENT.md` penuh dan `07-ui-guidelines.md` (dihapus). Berdasarkan token T-D2 dan migrasi Tahap B. |
