# Spesifikasi: Sumber Tunggal Design System SIMO

- **Versi:** 1.0 (draf untuk diserahkan ke Kiri melalui Niki)
- **Tanggal:** 2026-11-10
- **Penulis:** Sylpha (System Analysis)
- **Branch kerja:** `refactor/design-system`
- **Rujukan:** Surat Tugas Niki; keputusan final Boss (lihat 1.2); `docs/FE-AGENT.md`, `docs/07-ui-guidelines.md`, `simo/app/design/`, `simo/app/globals.css`, `simo/middleware.ts`, `simo/components/layout/AdminOnly.tsx`
- **Jalur:** Sedang. Tidak ada perubahan data, backend, atau API. Semua perubahan hanya di frontend dan dokumen.
- **Catatan metode:** semua angka di bawah berasal dari pencacahan regex pada kode (bukan asumsi), dijalankan 2026-11-10 pada `simo/app`, `simo/components`, `simo/lib` (115 berkas `.ts/.tsx/.css`, 85 di antaranya memuat kelas warna). Pencacah ada di scratchpad sesi ini; Kiri sebaiknya menjalankan ulang cacahan yang sama sebagai garis dasar sebelum migrasi (lihat T-D0).

---

## 1. Ringkasan dan keputusan Boss

### 1.1 Masalah
1. Token di `globals.css` belum menjadi sumber tunggal. Aplikasi memakai nama warna Tailwind langsung (`bg-blue-600`, `text-gray-500`, ...), sehingga mengubah `globals.css` tidak mengubah tampilan halaman aplikasi.
2. Panduan tertulis terpecah di tiga tempat (FE-AGENT.md, 07-ui-guidelines.md, halaman /design) dan saling bertentangan (bagian 4).
3. /design belum punya bagian Motion dan "Progres penataan".
4. /design terbuka tanpa login dan ikut ke produksi.

### 1.2 Keputusan Boss (final, tidak dibuka ulang di sini)
| No | Keputusan |
|---|---|
| K1 | Satu berkas tertulis `docs/DESIGN.md` menggantikan FE-AGENT.md dan 07-ui-guidelines.md. FE-AGENT.md boleh tersisa hanya sebagai penunjuk singkat ke DESIGN.md (dipakai agent). |
| K2 | Satu folder gambar acuan. |
| K3 | Token semantik (tingkat 2) di `globals.css` yang benar-benar dipakai komponen. Nilai awal SAMA PERSIS dengan tampilan sekarang. Tampilan tidak boleh berubah sedikit pun. |
| K4 | /design hanya dapat dibuka role `superadmin` di produksi; terbuka bebas bila `NODE_ENV !== 'production'`. |

### 1.3 Di luar cakupan (diajukan terpisah, tidak dikerjakan di sini)
- Mengubah tampilan apa pun (termasuk menyeragamkan green/emerald, gray-800 ke gray-700, merapikan `--primary` shadcn).
- Warna hex di Recharts dan `lib/export.ts` (PDF). Lihat 3.7.
- Dark mode (tidak dipakai di halaman aplikasi, lihat 2.3).
- Backend, password, riwayat git, rahasia.

---

## 2. Inventaris penggunaan warna (data nyata)

### 2.1 Total
- Kemunculan kelas warna Tailwind: **2.522** (utilitas `bg/text/border/ring/fill/stroke/from/to/via/divide/outline/placeholder/...` berwarna, termasuk yang berprefiks varian).
- Sebaran: `components/` (di luar ui) 1.601; `app/` (di luar /design) 505; `app/design` 341; `components/ui` 75; `lib/` 0.
- Di luar `app/design` (cakupan migrasi aplikasi): 2.181 kemunculan.
- Varian: `hover:` 249, `focus:` 103, `group-hover:` 3, `disabled:` 2, `focus-visible:` 1, `file:` 1. **`dark:` pada kelas warna = 0**; semua 22 kemunculan `dark:` ada di `components/ui` (shadcn) dan berupa token shadcn, bukan warna Tailwind langsung.
- Varian opacity pada warna (`/NN`): hanya 21 kemunculan, 10 jenis (terbanyak `bg-gray-50/50` 10x, `bg-black/50` 5x, `bg-blue-50/50` 2x, `bg-white/20` 2x).
- Kelas dinamis/gabungan string (`bg-${x}-600`): **0 ditemukan**. Pemetaan warna berbentuk objek literal penuh (contoh `StatCard.warnaMap`), sehingga aman diganti sebagai teks. Template literal ada (mis. `${td} text-right`) tetapi nama kelas warna tetap tertulis utuh.

### 2.2 Per kelompok peran

| Kelompok | Kemunculan total | Berkas | Di luar /design | Berkas di luar /design |
|---|---:|---:|---:|---:|
| Netral gray-* (teks, permukaan, garis) | 1.538 | 77 | 1.354 | 62 |
| brand = blue-* | 359 | 55 | 311 | 46 |
| danger = red-* | 212 | 44 | 177 | 38 |
| white/black/transparent | 202 | 69 | 172 | 59 |
| warning = orange-* | 87 | 25 | 67 | 21 |
| success = emerald-* | 85 | 28 | 74 | 25 |
| purple-* | 20 | 9 | 14 | 6 |
| green-* (sisa, bukan emerald) | 14 | 5 | 7 | 2 |
| yellow-* | 5 | 4 | 5 | 4 |
| **Jumlah** | **2.522** | | | |

### 2.3 Tabel per kelas (semua utilitas; kolom "berkas" = jumlah berkas berbeda)

Netral dan putih:

| Kelas (semua utilitas) | Jumlah | Berkas | Utilitas dominan (jumlah, seluruh kode) |
|---|---:|---:|---|
| gray-500 | 485 | 72 | text 483 |
| gray-100 | 194 | 61 | bg 123, border 55, divide 16 |
| gray-700 | 193 | 52 | text 192 |
| white | 189 | 64 | bg 122, text 67 |
| gray-200 | 173 | 59 | border 169, bg 4 |
| gray-900 | 123 | 55 | text 121 |
| gray-300 | 96 | 34 | border 86, text 7 |
| gray-600 | 89 | 32 | text 89 |
| gray-50 | 85 | 43 | bg 83 |
| gray-400 | 65 | 30 | text 62 |
| gray-800 | 35 | 16 | text 33 |
| black | 7 | 6 | bg (overlay `/10`,`/40`,`/50`) |

Brand (blue):

| Kelas | Jumlah | Berkas | Utilitas dominan |
|---|---:|---:|---|
| blue-600 | 114 | 45 | text 51, bg 49, border 12, ring 1, outline 1 |
| blue-500 | 113 | 27 | ring 54, border 53, text 5, bg 1 |
| blue-700 | 50 | 29 | text 28, bg 22 |
| blue-100 | 37 | 23 | bg 28, border 6, text 3 |
| blue-50 | 31 | 16 | bg 31 |
| blue-400 / 200 / 300 / 800 | 5 / 4 / 4 / 1 | 5 / 3 / 4 / 1 | tersebar |

Status:

| Kelas | Jumlah | Berkas | Utilitas dominan |
|---|---:|---:|---|
| red-600 | 102 | 36 | text 93, bg 9 |
| red-100 / 700 / 50 / 500 | 30 / 30 / 21 / 15 | 21 / 23 / 18 / 13 | bg100 26; text700 24; bg50 21; text500 8 + bg500 6 |
| red-200 / 400 / 300 | 9 / 3 / 2 | 8 / 3 / 2 | border |
| emerald-700 | 35 | 21 | text 29, bg 6 |
| emerald-100 / 600 / 50 / 500 / 200 / 800 | 18 / 16 / 7 / 6 / 2 / 1 | 16 / 13 / 6 / 6 / 2 / 1 | |
| orange-700 | 38 | 21 | text 37, bg 1 |
| orange-100 / 500 / 50 / 200 / 600 / 400 | 24 / 8 / 7 / 7 / 2 / 1 | 21 / 7 / 6 / 6 / 2 / 1 | |
| purple-100 / 600 / 700 / 500 | 9 / 6 / 4 / 1 | 8 / 5 / 4 / 1 | |
| green-100 / 700 / 200 / 500 | 6 / 4 / 3 / 1 | 5 / 4 / 3 / 1 | `StatusBadge` memakai green, bukan emerald |
| yellow-700 / 400 / 100 | 3 / 1 / 1 | 3 / 1 / 1 | |

Pasangan utilitas-warna terbanyak (seluruh kode): `text-gray-500` 483, `text-gray-700` 192, `border-gray-200` 169, `bg-gray-100` 123, `bg-white` 122, `text-gray-900` 121, `text-red-600` 93, `text-gray-600` 89, `border-gray-300` 86, `bg-gray-50` 83, `text-white` 67, `text-gray-400` 62, `border-gray-100` 55, `ring-blue-500` 54, `border-blue-500` 53, `text-blue-600` 51, `bg-blue-600` 49.

Catatan: `ring-blue-500` + `border-blue-500` (107x) adalah pasangan fokus input, jadi `blue-500` dalam praktik berperan "cincin fokus brand", bukan blue umum.

### 2.4 Token shadcn yang sudah ada di `globals.css` dan pemakaiannya

- `globals.css` (Tailwind **4.3.0**, `@import "tailwindcss"`, `tw-animate-css`, `shadcn/tailwind.css`, `@theme inline`) mendefinisikan token shadcn: `background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-1..5, sidebar-*, radius`, dipetakan ke utilitas lewat `@theme inline { --color-primary: var(--primary) ... }`.
- **Pemakaian: 144 kemunculan, seluruhnya di `components/ui/*` (shadcn). Halaman `app/` dan komponen fitur memakai 0.** Token teratas: `text-accent-foreground` 12, `text-muted-foreground` 11, `text-foreground` 8, `bg-muted` 8, `bg-muted/50` 7, `bg-popover` 6, `bg-accent` 6, `text-destructive` 5. Token `sidebar-*`, `chart-*`, `bg-card`, `bg-background` (1x, di `body` lewat `@apply`) praktis tidak dipakai komponen.
- Akibatnya ada dua sistem warna: (a) token shadcn dalam skala **netral** (abu tanpa rona) untuk komponen shadcn; (b) palet Tailwind biru-kelabu (gray-*, `hue 264`) untuk seluruh halaman. Keduanya tidak sama: `--border` shadcn = `oklch(0.922 0 0)`, sedangkan `gray-200` = `oklch(92.8% 0.006 264.531)`. **Karena itu `line` tidak boleh disatukan dengan `border` shadcn** tanpa mengubah piksel.
- Kebetulan penting (diverifikasi di `node_modules/tailwindcss/theme.css`): `--primary` shadcn = `oklch(0.488 0.243 264.376)` = **blue-700**, bukan blue-600 yang dipakai aplikasi (brand). `--destructive` = `oklch(0.577 0.245 27.325)` = red-600. `--ring` = blue-700.
- Temuan kerapian: `globals.css` punya dua blok `:root`. Blok pertama di `@layer base` berisi angka HSL mentah (`--primary: 221.2 83.2% 53.3%`, dst., gaya shadcn lama). Blok kedua (tak berlapis) berisi `oklch(...)` dan **menang** karena CSS tak berlapis mengalahkan `@layer`. Blok pertama praktis kode mati, kecuali `--destructive-foreground` (hanya ada di blok mati, tidak dipetakan ke utilitas). `--radius` efektif = **0.625rem**, bukan 0.5rem.
- Gaya dasar: `* { @apply border-border outline-ring/50 }`; `body { bg-background text-foreground }`; `html { font-sans }` dengan `--font-sans: var(--font-inter)` (Inter via `next/font`). `app/layout.tsx` juga memberi `body` kelas `bg-gray-50`.

### 2.5 Pemakaian di luar kelas Tailwind
- Nilai arbitrer warna: `bg-[#94a3b8]` 2, `bg-[#2563eb]` 2, `text-[#10B981]` 1. Ukuran arbitrer: `text-[11px]` 15, `text-[10px]` 9, `text-[9px]` 2, `text-[0.8rem]` 1 (yang terakhir dari shadcn button).
- Hex literal di luar `/design` (Recharts/properti JS): `#2563EB` 21x, `#9CA3AF` 16x, `#F0F0F0` 12x, `#10B981` 6x, `#94A3B8` 5x, `#E5E7EB` 4x, `#6B7280` 4x, `#F97316` 3x, dst.; tersebar di 11 berkas (grafik + `simulasi/page.tsx` + `laporan/page.tsx`). `lib/export.ts` memakai larik RGB `[37, 99, 235]` (jsPDF), bukan kelas.
- Radius pada kode: `rounded-lg` 277, `rounded-xl` 138, `rounded-full` 76, `rounded-md` 18, `rounded-2xl` 1. Shadow: `shadow-sm` 73, `shadow-md` 9, `shadow-lg` 5.

---

## 3. Rancangan token semantik (tingkat 2)

### 3.1 Prinsip
1. **Nilai awal = nilai Tailwind yang sama persis.** Dicapai dengan alias ke variabel tema bawaan Tailwind (`var(--color-blue-600)`), bukan menyalin hex. Dengan begitu hasil CSS terkompilasi identik, bukan "mendekati".
2. Hanya kelompok yang peranannya jelas dan sering dipakai yang ditokenkan (kriteria: peran tunggal, >= 20 kemunculan, atau satu skala utuh agar penggantian nama mekanis tanpa celah).
3. Nama menyatakan **peran**, bukan rona. Kecuali skala status yang memakai nama peran (`brand`, `danger`, `success`, `warning`) dan menyimpan skala penuh 50..900.

### 3.2 Sintaks Tailwind v4 yang benar
Versi terpasang: Tailwind **4.3.0** dengan `@tailwindcss/postcss` (CSS-first, tanpa `tailwind.config`). Token warna diekspos sebagai utilitas dengan namespace `--color-*` di dalam `@theme`. Gunakan **`@theme inline`** (sudah dipakai berkas ini) supaya nilai alias di-inline saat build dan utilitas tidak bergantung pada urutan variabel `:root`.

```css
@theme inline {
  /* Brand (alias skala blue) */
  --color-brand-50:  var(--color-blue-50);
  --color-brand-100: var(--color-blue-100);
  --color-brand-200: var(--color-blue-200);
  --color-brand-300: var(--color-blue-300);
  --color-brand-400: var(--color-blue-400);
  --color-brand-500: var(--color-blue-500);
  --color-brand-600: var(--color-blue-600);
  --color-brand-700: var(--color-blue-700);
  --color-brand-800: var(--color-blue-800);
  --color-brand-900: var(--color-blue-900);
  /* Status: danger = red, success = emerald, warning = orange, skala 50..900 sama pola */
  --color-danger-50: var(--color-red-50);   /* ... sampai -900 */
  --color-success-50: var(--color-emerald-50); /* ... */
  --color-warning-50: var(--color-orange-50);  /* ... */
  /* Teks */
  --color-fg: var(--color-gray-900);
  --color-fg-secondary: var(--color-gray-700);
  --color-fg-tertiary: var(--color-gray-600);
  --color-fg-muted: var(--color-gray-500);
  --color-fg-subtle: var(--color-gray-400);
  --color-fg-inverse: var(--color-white);
  /* Permukaan */
  --color-surface: var(--color-white);
  --color-surface-subtle: var(--color-gray-50);
  --color-surface-muted: var(--color-gray-100);
  /* Garis */
  --color-line: var(--color-gray-200);
  --color-line-subtle: var(--color-gray-100);
  --color-line-strong: var(--color-gray-300);
}
```
Hasil: utilitas `bg-brand-600`, `text-fg-muted`, `border-line`, `ring-brand-500`, `hover:bg-danger-700`, `bg-surface/50` otomatis tersedia (varian dan opacity bekerja karena token bernamespace `--color-*`).

Risiko sintaks yang WAJIB dibuktikan Kiri di T-D2 sebelum migrasi massal:
- (a) Alias `var(--color-blue-600)` di dalam `@theme inline` harus ter-resolve menjadi nilai oklch yang sama pada CSS keluaran. Cara bukti: bangun CSS sebelum/sesudah, cari deklarasi `.bg-brand-600` dan `.bg-blue-600` (sementara keduanya dipakai), nilainya harus identik.
- (b) Variabel `--color-blue-*` hanya diemisikan Tailwind bila terpakai; dengan `inline` tidak masalah karena nilai disalin. Bila ternyata gagal ter-resolve, cadangan: `@theme static` atau menulis nilai oklch literal salinan dari `node_modules/tailwindcss/theme.css` (tetap identik).
- (c) Nama `fg`/`line`/`surface` tidak boleh bentrok dengan token shadcn yang ada (`foreground`, `border`, `card`, `muted`, `accent`, `background`). Daftar nama di atas sengaja dipilih tidak bentrok. Nama `accent` TIDAK dipakai untuk ungu karena bentrok dengan `accent` shadcn.

### 3.3 Pemetaan peran dan data pendukung

| Token baru | Menggantikan (pasangan utilitas) | Kemunculan (seluruh kode) | Peran |
|---|---|---:|---|
| `brand-50..900` | `blue-50..900` semua utilitas | 359 | Aksen utama: tombol primer, nav aktif, fokus, tautan, tint |
| `danger-50..900` | `red-*` | 212 | Error, stok kritis, hapus |
| `success-50..900` | `emerald-*` | 85 | Aman, sukses |
| `warning-50..900` | `orange-*` | 87 | Mendekati ROP/expired, peringatan |
| `fg` | `text-gray-900` | 121 | Judul, angka utama |
| `fg-secondary` | `text-gray-700` | 192 | Label form, sel tabel, judul card |
| `fg-tertiary` | `text-gray-600` | 89 | Isi/teks konten |
| `fg-muted` | `text-gray-500` | 483 | Sublabel, caption, placeholder (teks yang dibaca, lolos AA) |
| `fg-subtle` | `text-gray-400` | 62 | **Hanya ikon/elemen non-teks** (aturan WCAG di FE-AGENT 1.1) |
| `fg-inverse` | `text-white` | 67 | Teks di atas warna pekat |
| `surface` | `bg-white` | 122 | Kartu, panel, input |
| `surface-subtle` | `bg-gray-50` | 83 | Latar halaman, hover baris, header tabel |
| `surface-muted` | `bg-gray-100` | 123 | Hover netral, skeleton, chip, latar ikon netral |
| `line` | `border-gray-200` | 169 | Border kartu/tabel/divider |
| `line-subtle` | `border-gray-100`, `divide-gray-100` | 55 + 16 | Pemisah baris halus |
| `line-strong` | `border-gray-300` | 86 | Border input/tombol sekunder |

Ringkasan jumlah yang tercakup di luar /design: kira-kira 1.304 dari 1.354 kemunculan gray (96%) plus seluruh skala blue/red/emerald/orange (629) plus `bg-white`/`text-white`. Jumlah pastinya dihitung Kiri di T-D0.

### 3.4 Yang SENGAJA dibiarkan, dan alasannya

| Dibiarkan | Kemunculan | Alasan |
|---|---:|---|
| `text-gray-800` | 33 | Tidak ada di tabel warna FE-AGENT; peran tumpang tindih dengan 700 dan 900. Menyatukannya ke 700 mengubah piksel. Dicatat sebagai penyimpangan di DESIGN.md, keputusan Boss. |
| `text-gray-300`, `bg-gray-200/300/400/500/800/900`, `border-gray-50/400`, `divide-gray-50` | sekitar 25 | Frekuensi rendah dan peran tidak seragam (disabled, dekoratif). Token baru yang dipakai 1-3 kali tidak membantu. |
| `purple-*` | 20 | Peran lemah (retur, badge superadmin, kartu "Total Cost"), nama peran belum disepakati, dan nama `accent` bentrok dengan shadcn. Tetap kelas Tailwind sampai Boss menamai perannya. |
| `green-*` | 14 | Menduplikasi `emerald` untuk "aman" (`StatusBadge` memakai green-100/700/200, bagian lain emerald). Menggabungkan = perubahan tampilan. Dicatat sebagai ketidakkonsistenan di DESIGN.md. |
| `yellow-*` | 5 | Terlalu sedikit; dipakai sebagai peringatan "menengah" (kontras). |
| `black` + opacity (`bg-black/50`, `/40`, `/10`) | 7 | Overlay modal; nilai bergantung komponen shadcn. |
| `white/NN` (`bg-white/20`) | 2 | Varian opacity jarang; tidak migrasi agar tidak menambah risiko `color-mix`. |
| Token shadcn (`primary`, `muted`, ...) di `components/ui` | 144 | Sistem terpisah (netral, bukan biru-kelabu). Menggabung ke token baru akan mengubah piksel (mis. `--primary` = blue-700 bukan blue-600). Dibiarkan; didokumentasikan sebagai "token shadcn: hanya untuk komponen `components/ui` bawaan shadcn". |
| Hex di Recharts, `lib/export.ts` | sekitar 90 | Bukan kelas Tailwind; lihat 3.7. |

### 3.5 Strategi migrasi mekanis (aman, nilai identik)
Prasyarat: T-D2 (token ditambah, belum ada yang diganti) lolos build dan bukti (a) di 3.2.

Aturan penggantian (satu kelompok = satu commit/langkah, dapat dibatalkan sendiri):
1. Pola kelas dengan **batas kata** yang menjaga prefiks varian dan akhiran opacity. Contoh regex (PCRE/JS): `(?<![\w-])((?:[a-z0-9\-\[\]\.&>:_]+:)*)(bg|text|border|ring|fill|stroke|from|to|via|divide|outline|decoration|placeholder)-blue-(50|100|200|300|400|500|600|700|800|900)(?![\w-])` diganti `$1$2-brand-$3`. Lookbehind `(?<![\w-])` mencegah mengganti bagian dari kelas lain (`group-hover:`, `data-[x]:`, `peer-`) secara salah dan `(?![\w-])` mencegah `blue-600` menelan `blue-6000`/`blue-600-foo`. Sufiks opacity (`/50`) tetap karena tidak ikut pola.
2. Urutan kelompok: (1) brand, (2) danger, (3) success, (4) warning, (5) permukaan (`bg-white`, `bg-gray-50`, `bg-gray-100`), (6) garis (`border-gray-200/100/300`, `divide-gray-100`), (7) teks (`text-gray-900/700/600/500/400`, `text-white`). Teks terakhir karena paling banyak dan paling tersebar.
3. Penggantian per pasangan utilitas-warna eksplisit untuk kelompok netral (bukan seluruh skala gray). `text-gray-500` -> `text-fg-muted`, tapi `bg-gray-500` (2x) dan `border-gray-400` TIDAK disentuh. Untuk skala status/brand, ganti seluruh skala.
4. Setelah tiap kelompok: `npx tsc --noEmit`, `npm run build`, lalu hitung ulang: tidak ada sisa kelas yang dimigrasi (pencacah yang sama harus menghasilkan 0 untuk pola kelompok itu di berkas cakupan).
5. Verifikasi visual per kelompok (lihat AC-DS-1) sebelum lanjut ke kelompok berikut.

Risiko dan penanganan:

| Risiko | Penanganan |
|---|---|
| Kelas ditulis terpecah/dinamis sehingga regex tidak menangkap | Terbukti 0 pola `bg-${x}-N`. Setelah migrasi, jalankan grep sisa; temuan sisa diperiksa manual. |
| Opacity seperti `bg-blue-50/50` | Regex mempertahankan sufiks; `bg-brand-50/50` valid di v4. Dicakup di AC bukti CSS (b). |
| `cn()`/`tailwind-merge` menganggap `bg-brand-600` dan `bg-blue-600` kelas berbeda grup | Belum terbukti apakah `tailwind-merge` 2.6.1 (terpasang) menganggap `bg-brand-600` satu grup dengan `bg-primary`/`bg-blue-600`; bila tidak, kelas lama dan baru sama-sama bertahan di DOM dan urutan CSS menentukan hasil. Kiri WAJIB menguji satu kasus: komponen yang menimpa `className` bawaan (mis. `Button` dengan `className="bg-brand-600"` menimpa `bg-primary`) dan memastikan hanya satu yang tersisa. Jika tidak, tambahkan `extendTailwindMerge` di `lib/utils.ts` (perubahan kode kecil, dilaporkan ke Niki). |
| Berkas `components/ui/*` shadcn memuat kelas warna Tailwind langsung | `AlertNotification`, `ConfirmDialog`, `ObatCombobox`, `StatusBadge`, `alert-dialog`, `dialog` memuat 75 kelas warna dan IKUT dimigrasi (bukan shadcn murni, buatan SIMO). Berkas shadcn murni (button, badge, card, dropdown-menu, input, select, table, dst.) memakai token shadcn dan tidak disentuh. |
| Kelas muncul di komentar/dokumen | Tidak berpengaruh tampilan; regex hanya dijalankan di `.ts/.tsx` dan hasil diff ditinjau. |
| Berkas `/design` memakai kelas yang sama dan ikut diganti | Itulah alasan migrasi SETELAH perubahan /design (bagian 7). |
| Typo nama baru menghasilkan kelas tak dikenal (tampil tanpa gaya, tanpa error) | AC bukti CSS + AC screenshot; ditambah grep daftar kelas `(brand|danger|success|warning)-\d+` terhadap daftar skala yang didefinisikan. |
| Mengubah token kelak (mis. `brand-600`) memengaruhi `border-brand-500` fokus, dll. | Disengaja; itu tujuan sumber tunggal. DESIGN.md menjelaskan skala mana dipakai untuk apa. |

#### 3.5.1 Revisi v1.1 (10 Nov 2026, disetujui Sylpha)
1. Daftar prefiks 3.5 butir 1 diperluas: `border-t/-l/-x`, `shadow-*`, dan `ring-offset-*` pada skala brand/status ikut dimigrasi (nilai identik; hanya memperluas prefiks, bukan kebutuhan baru). Kelas di 3.4 (gray-800, purple, green, yellow, black, transparent, white/NN, dll.) tetap tidak dimigrasi dan dicatat sebagai penyimpangan.
2. Tahap B boleh dijalankan per kelompok berkas (b..g), bukan per jenis warna, asalkan tiap kelompok lolos tangkapan layar (AC-DS-1), bukti CSS identik, dan dapat dikembalikan sendiri.

### 3.6 Cara mengubah tampilan setelah migrasi (untuk DESIGN.md)
Ubah satu baris di `globals.css`, misalnya `--color-brand-600: oklch(...)`, dan seluruh tombol primer/nav aktif/teks tautan berubah. Warna netral diubah lewat `--color-fg-muted`, `--color-line`, dst.

### 3.7 Batasan jujur sumber tunggal (hex grafik dan PDF)
Setelah tugas ini, "sumber tunggal" berlaku untuk **kelas Tailwind**. Warna di Recharts (`stroke="#2563EB"`) dan PDF (`[37, 99, 235]`) masih literal. Opsi lanjutan (bukan scope sekarang): grafik memakai `var(--color-brand-600)` (SVG menerima `var()`), PDF membaca dari satu konstanta di `lib/constants.ts`. Diajukan ke Niki sebagai usulan terpisah.

---

## 4. Analisis konflik dan duplikasi dokumen

### 4.1 Perbandingan (kebenaran menurut kode nyata)

| Topik | FE-AGENT.md (2026-05-22) | 07-ui-guidelines.md (7 Okt) | /design | Kode nyata | Putusan |
|---|---|---|---|---|---|
| Aksen utama | blue-600 | blue-600 | Blue 600 | blue-600 dominan | Sepakat. Tetap. |
| Warna "aman" | emerald-100/700 | **green**-100/800 | emerald-700 / bg-green-100 (campur) | `StatusBadge` green-100/700/200; sisanya emerald | **Kode sendiri tidak konsisten.** DESIGN.md mencatat penyimpangan, tidak memilih (butuh keputusan Boss karena mengubah tampilan). |
| Warna "mendekati ROP" | orange | **yellow**-100/800 | orange | orange-100/700/200 | 07 usang. Orange benar. |
| Judul halaman | `text-xl font-bold` | `text-2xl font-bold` | Tipografi menampilkan `text-2xl` | 5 halaman `text-xl font-bold text-gray-900` (+1) | **FE-AGENT benar.** /design (contoh Tipografi) dan 07 salah; `PageHeader` /design sendiri memakai `text-2xl` (itu judul halaman /design, bukan app). |
| Angka kartu stat | `text-2xl font-bold` | `text-3xl`, `p-6`, `border-gray-100` | text-2xl | `text-2xl`, `p-5`, `border-gray-200`; `text-3xl` = 0 pemakaian | FE-AGENT benar; 07 usang. |
| Kartu | `rounded-xl border-gray-200 bg-white p-5 shadow-sm` | `rounded-xl shadow-sm border-gray-100 p-6` | sama dengan FE-AGENT | 19+12+11+... kemunculan pola FE-AGENT | FE-AGENT benar. |
| Radius | lg tombol/input, xl kartu | sama | "lg 8px, xl 12px" | `--radius: 0.625rem` -> **lg = 10px, xl = 14px, md = 8px, 2xl = 18px** (dihitung dari CSS) | **/design salah angka px** (mengira nilai bawaan Tailwind). Perlu diukur Tessa di browser, lalu perbaiki teks. |
| Item nav aktif | `bg-blue-600 text-white` | `bg-blue-50 text-blue-700` | menurut Navigasi | `Sidebar` `bg-blue-600 text-white` | FE-AGENT benar; 07 usang. |
| Tombol sukses/peringatan | tidak ada | green-600 / yellow-500 | n/a | `bg-yellow-500` tidak dipakai; tombol success hampir tidak ada | 07 usang. Hapus. |
| Skeleton | `animate-pulse bg-gray-100 rounded-xl` | `bg-gray-200 rounded animate-pulse` | n/a | hampir semua skeleton memakai `bg-gray-100` (satu `bg-gray-50`) | FE-AGENT benar. |
| Warna grafik | #2563EB, #10B981, #8B5CF6 | blue-500 #3B82F6, orange, red-500, green-500 | n/a | `#2563EB` dominan, `#10B981`, `#F97316`, `#8B5CF6`, `#94A3B8`... | FE-AGENT lebih dekat; 07 usang. |
| Font | Inter | Inter | Inter | Inter (`--font-inter` via `next/font`) | Sepakat. |
| Kontras WCAG AA | bagian 1.1 lengkap (tabel rasio) | ringkasan + tautan ke FE-AGENT | tidak menyebut | diterapkan sebagian (lihat 5.3) | **Pertahankan penuh.** |
| Responsif | tidak ada | tabel breakpoint (lg sidebar, md collapse, sm drawer) | tidak ada | sidebar drawer di `< lg` (commit dae05b8) | Ambil dari 07, koreksi: tidak ada kondisi "md collapse" terpisah. Perlu verifikasi di T-D1. |
| Format angka/tanggal | tidak ada | tabel + helper | tidak ada | helper ada di `lib/utils.ts` | Ambil dari 07 (masih valid), verifikasi isi helper. |
| Layout sidebar | `w-64`, brand title dst. | pohon menu ber-section (UTAMA/TRANSAKSI/...) | tidak lengkap | sidebar datar, tanpa section; menu Simulasi/Analisis/Perhitungan dinonaktifkan (dikomentari) | **07 usang**. FE-AGENT bagian 5 juga memuat halaman nonaktif; tandai. |
| Halaman | 13 halaman + checklist; tidak ada Reorder, Pemantauan | tidak ada | n/a | Ada `/reorder`, `/pemantauan` (superadmin), `/login`, `not-found`, `error` | Checklist FE-AGENT kurang dua halaman. |
| Checklist | Monitoring belum dicentang | tidak ada | tidak ada | `/monitoring` ada | Dipakai sebagai dasar "Progres penataan" (bagian 5.2). |
| Gambar acuan | menyebut Willow/Medicare/Pharmo | tidak | menyebut Akuris di `docs/design-reference/` | 2 folder: `design-reference/` (17 gambar Akuris), `ui-design-reference/` (4 gambar; **SUDAH DIHAPUS** di commit 0fe317d, keputusan Boss 10 Nov 2026) | Satu folder: `docs/design-reference/` (K2), lihat 5.4. |

Ringkas: **07-ui-guidelines.md dominan usang** (status kuning, nav biru muda, kartu `p-6`/`text-3xl`, tombol Success/Warning, pohon sidebar). Bagian yang masih layak dipindah: format angka/tanggal, daftar ikon Lucide, aturan loading/empty state (verifikasi), catatan Inter. FE-AGENT.md akurat untuk hampir semua kelas, kecuali bagian halaman nonaktif dan checklist.

Rujukan eksternal yang harus diperbarui saat dokumen digabung: `docs/02-folder-structure.md` (baris menyebut 07-ui-guidelines), `docs/README.md`, `docs/pm/PLAN.md`, komentar di `simo/components/layout/ErrorPanel.tsx` (menyebut FE-AGENT; berupa komentar, ubah hanya bila Kiri diizinkan menyentuh komentar; lihat T-D4).

### 4.2 Struktur usulan `docs/DESIGN.md`
Satu berkas, urutan sama dengan menu /design supaya mudah dilacak:

0. Cara memakai dokumen ini + aturan wajib untuk agent (baca dulu; larangan; 5.3)
1. Prinsip desain (clean, white-dominant, aksen hanya pada ikon/badge/status, hierarki, UX)
2. Foundations
   - 2.1 Warna (tabel token tingkat 2 dengan nilai, peran, contoh; token shadcn terpisah; penyimpangan yang diketahui: green vs emerald, gray-800, `--primary` = blue-700)
   - 2.2 Aksesibilitas dan kontras WCAG AA (utuh dari FE-AGENT 1.1)
   - 2.3 Tipografi (Inter, skala, tabular-nums, mono)
   - 2.4 Radius dan elevasi (angka px yang benar)
   - 2.5 Ikon (Lucide + daftar)
   - 2.6 Motion (hanya yang dipakai; 6.2)
3. Layout (sidebar, header, area konten, page header, responsif)
4. Komponen (stat card, kartu/panel, tabel, badge status, tombol, form, chart container, skeleton, empty state, paginasi + `getPageNumbers`, dropdown, dialog/overlay, notifikasi)
5. Data (tabel, chart: palet grafik, aturan hex literal)
6. Format angka dan tanggal
7. Pemetaan per halaman (SIMO domain) + hak akses per peran
8. Progres penataan (tabel; sumber satu-satunya checklist)
9. Cara mengubah token (satu sumber: `globals.css`; komponen: `components/ui`)
10. Riwayat dokumen (versi, tanggal, perubahan)

FE-AGENT.md baru (penunjuk): beberapa baris saja: "Design system SIMO sekarang satu sumber: `docs/DESIGN.md`. Baca seluruhnya sebelum menyentuh UI. Aturan wajib: ..." dan memuat ulang 5.3 secara ringkas karena agent hanya diarahkan ke berkas ini.

07-ui-guidelines.md: dihapus (atau diganti penunjuk satu baris). Rekomendasi: **dihapus**, karena Boss ingin sumber tunggal dan tautan masuknya hanya 3 (4.1).

---

## 5. Aturan yang HARUS dipertahankan, progres, dan folder gambar

### 5.1 Pernyataan sumber tunggal
Aturan konten: tidak boleh ada nilai warna/ukuran yang tertulis di dua tempat. DESIGN.md menautkan ke `globals.css` untuk nilai token (tidak menyalin hex), kecuali tabel kontras WCAG yang memang angka rasio.

### 5.2 Progres penataan (isi awal; bukti = checklist FE-AGENT + berkas di kode)

| Halaman | Berkas utama | Status awal | Bukti / catatan |
|---|---|---|---|
| Layout (Sidebar + Header) | `components/layout/*`, `app/(dashboard)/layout.tsx` | Mengikuti | Checklist [x]; `bg-blue-600 text-white` aktif; responsif drawer (dae05b8) |
| Dashboard | `app/(dashboard)/dashboard`, `components/dashboard/*` | Mengikuti | Checklist [x] |
| Data Obat (list/tambah/detail/edit) | `app/(dashboard)/obat/**`, `components/obat/*` | Mengikuti | Checklist [x]; 13 kandidat kontras di `components/obat` perlu ditinjau |
| Barang Masuk | `barang-masuk`, `components/transaksi/BarangMasuk*` | Mengikuti | Checklist [x]; rujukan WCAG |
| Barang Keluar | `barang-keluar`, `components/transaksi/BarangKeluar*` | Mengikuti | Checklist [x] |
| Monitoring | `monitoring`, `components/monitoring/*` | **Belum** | Checklist [ ] |
| Perhitungan EOQ/ROP | `perhitungan`, `components/perhitungan/*` | Mengikuti (menu nonaktif) | Checklist [x]; dinonaktifkan di Sidebar |
| Laporan | `laporan` | Mengikuti | Checklist [x] |
| Simulasi | `simulasi`, `components/simulasi/*` | Mengikuti (menu nonaktif) | Checklist [x]; 6 kandidat kontras di halaman |
| Analisis Komparatif | `analisis`, `components/analisis/*` | Mengikuti (menu nonaktif) | Checklist [x] |
| Supplier (list/tambah/edit) | `supplier/**`, `components/supplier/*` | Mengikuti | Checklist [x]; 5 kandidat kontras di `SupplierForm` |
| Manajemen User | `users`, `components/users/*` | Mengikuti | Checklist [x]; 7 kandidat kontras |
| Pengaturan | `pengaturan`, `components/pengaturan/*` | Mengikuti | Checklist [x] |
| Login | `app/(auth)/login` | Mengikuti | Checklist [x] |
| Reorder | `reorder`, `components/reorder/*` | **Belum tercatat** | Tidak ada di FE-AGENT; Kiri/Tessa menilai |
| Pemantauan (superadmin) | `pemantauan`, `components/pemantauan/*` | **Belum tercatat** | Tidak ada di FE-AGENT |
| Halaman error / not-found | `app/error.tsx`, `not-found.tsx`, `(dashboard)/error.tsx` | **Belum tercatat** | |

Catatan jujur: "Mengikuti" hanya berarti sudah di-acc user menurut checklist FE-AGENT, bukan hasil audit baru. Kolom "kandidat kontras" = jumlah `text-gray-400|red-500|emerald-600|orange-500/600|yellow-500/600|blue-500` per folder (total 69 kemunculan di luar /design: obat 13, transaksi 12, users 7, simulasi 6, supplier 7, ...); sebagian sah (ikon). Perlu tinjau manual, bukan otomatis pelanggaran. Setelah migrasi token, angka ini tetap dihitung dengan nama baru (`text-fg-subtle` = gray-400, tinjau 62 pemakaian).

Sumber tunggal Progres: DESIGN.md bagian 8 (di dokumen). Halaman /design menampilkan salinan tampilan dari data yang sama (lihat 6.3).

### 5.3 Aturan FE-AGENT.md yang HARUS dipertahankan (pindah ke DESIGN.md/penunjuk)
1. **"Baca sebelum menyentuh UI"**: agent/dev wajib membaca DESIGN.md penuh sebelum mengubah halaman (FE-AGENT bagian 7 butir 1-2).
2. Larangan menyentuh logic: hooks, fetch, API, validasi, types. Hanya JSX + kelas (butir 3, kotak peringatan di awal).
3. Larangan skill/desain eksternal tanpa izin eksplisit Boss (aturan dari memori proyek; kasus kartu Distribusi Kategori adalah satu-satunya izin yang sudah diberikan, commit dfc6495).
4. **Implementasi bertahap**: satu halaman selesai dan di-acc user, baru lanjut (butir 7); user acc lalu centang Progres.
5. **WCAG 2.1 AA (1.1)** utuh: tabel pengganti warna gagal kontras beserta rasio, pengecualian ikon/badge 1-2 karakter/disabled, catatan "large text hampir tidak berlaku", kewajiban menghitung rasio untuk warna baru. Rujukan `/barang-masuk`.
6. Prinsip: kartu/panel **selalu putih**, latar halaman abu sangat muda, warna hanya pada ikon/badge/status (bukan latar besar), hierarki teks.
7. Spesifikasi komponen (stat card, tabel, badge, tombol, form, paginasi + `getPageNumbers` wajib, chart, skeleton, empty state).
8. Font Inter; jangan diganti tanpa alasan kuat (riset tipografi kesehatan).
9. Konsistensi dengan halaman yang sudah selesai; satu halaman = satu acc.
10. Aturan baru dari tugas ini: **warna di kelas hanya memakai token tingkat 2** (`brand/danger/success/warning/fg*/surface*/line*`); kelas Tailwind warna mentah untuk kelompok yang sudah dimigrasi dilarang (lihat AC-DS-5). Warna baru: tambahkan token di `globals.css` dulu, lalu pakai.

Bagian "Design references: Willow, Medicare, Pharmo" pindah ke Riwayat/Referensi di DESIGN.md.

### 5.4 Satu folder gambar acuan (K2)
**Putusan akhir (Boss, 10 Nov 2026):** satu folder `docs/design-reference/` berisi 17 gambar Akuris (Okt 2026) sebagai acuan redesign; tidak dipindah atau diubah (tanpa subfolder `akuris/` dan `simo-mockup/`, tanpa README). `docs/ui-design-reference/` (referensi lama Mei 2026) **sudah dihapus** (commit 0fe317d); pemulihan bila perlu: `git checkout 9938725 -- docs/ui-design-reference`. DESIGN.md bagian 7 menyebut folder ini. Rekomendasi awal Sylpha (memindahkan ke subfolder) tidak dilaksanakan.

---

## 6. Spesifikasi halaman /design

### 6.1 Kondisi sekarang
`simo/app/design/` memiliki `layout.tsx` (sidebar hash-anchor, grup Foundations/Komponen/Data), `page.tsx` (satu halaman scroll, 12 `*Section`), `_components.tsx`, dan 12 berkas `*/section.tsx` (total sekitar 880 baris). Footer sidebar tertulis "Referensi internal — tidak butuh login" (harus diubah).

### 6.2 Bagian Motion (hanya bila dipakai app)
Dicek di kode (`app/`, `components/`): motion **ada dan terbatas**. Maka bagian Motion layak dibuat, mendokumentasikan pola nyata saja:

| Pola | Bukti jumlah | Pemakaian |
|---|---:|---|
| `transition-colors` | 141 | hover/fokus tombol, baris, nav (dominan) |
| `animate-pulse` | 46 (27 berkas) | skeleton loading |
| `animate-spin` | 7 | spinner |
| `transition-transform` | 7 | ikon chevron/rotasi |
| `transition-all` / `transition` / `transition-opacity` | 3 / 3 / 1 | kasus khusus |
| `duration-100` / `150` / `200` | 5 / 2 / 1 | durasi eksplisit (hover grafik 150ms) |
| `animate-in/out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*` | 7/7/5/12 | **hanya** dropdown, dialog, popover shadcn (tw-animate-css) |
| `motion-reduce:transition-none` | 2 | hanya di `ObatKategoriChart` |

Isi bagian Motion: (1) pola di atas dengan contoh hidup kecil (skeleton, spinner, hover tombol); (2) aturan: durasi bawaan Tailwind kecuali dicatat, tidak ada `ease-*` khusus (0 pemakaian), tidak ada animasi dekoratif; (3) catatan jujur: dukungan `prefers-reduced-motion` baru ada di satu komponen; animasi `animate-pulse`/`animate-spin`/transisi lain belum menghormatinya. Itu temuan aksesibilitas yang dicatat di DESIGN.md sebagai penyimpangan, perbaikannya usulan terpisah (butuh keputusan karena menyentuh banyak berkas). Tidak ada `@keyframes` khusus dan tidak ada pustaka animasi.

### 6.3 Bagian "Progres penataan"
Grup menu baru "Workspace" (sesuai referensi Akuris) berisi satu item "Progres penataan" (`#progres`). Isinya tabel halaman (5.2): nama halaman, rute, status (Mengikuti / Belum / Belum tercatat), catatan. Data diambil dari satu konstanta TypeScript statis (mis. `app/design/progres/data.ts`) yang disalin dari DESIGN.md bagian 8; DESIGN.md tetap sumber utama, dan T-D3 menyertakan baris komentar "ubah DESIGN.md dan berkas ini bersamaan". Alternatif otomatis (mem-parsing DESIGN.md saat build) ditolak: menambah kompleksitas tanpa nilai bagi skripsi.

### 6.4 Penanda versi dan tautan
- Header /design menampilkan "Design System v1.0 · 2026-11-10" (konstanta tunggal di `_components.tsx` atau `app/design/versi.ts`, disinkronkan manual dengan bagian Riwayat DESIGN.md).
- Tautan ke DESIGN.md: teks "Panduan tertulis: docs/DESIGN.md" di header dan footer sidebar. Karena `docs/` bukan bagian aplikasi yang disajikan Next, tautan berupa teks jalur (bukan hyperlink) kecuali Boss ingin tautan GitHub (butuh URL repo; pertanyaan terbuka P2).
- Kalimat "Satu sumber untuk semua tampilan: ubah token di globals.css, komponen di components/ui" tetap di `page.tsx`, menjadi benar setelah migrasi.
- Perbaiki konten usang di /design: footer "tidak butuh login", angka px radius (lg 10px, xl 14px), contoh judul halaman `text-2xl` (aplikasi memakai `text-xl`), dan swatch yang menyebut `bg-green-100` bersama emerald.
- Bagian Warna diubah agar menampilkan **token tingkat 2** (nama token, nilai, dan swatch memakai kelas token itu sendiri), sehingga mengubah `globals.css` terlihat langsung di /design.

### 6.5 Kontrol akses
Kondisi teknis nyata:
- `middleware.ts` hanya memeriksa **keberadaan** cookie `simo_token` (cookie berisi JWT, tanpa pengecekan role). `/design` sekarang ada di `STANDALONE_PATHS` sehingga lolos tanpa login.
- Role ada di `useAuthStore` (`user.role`, sumber: `sessionStorage`, bukan cookie). Pola yang sudah ada: `components/layout/AdminOnly.tsx` (komponen klien; menunggu `isHydrated`; `router.replace('/dashboard')` bila bukan admin; tidak merender anak sampai terverifikasi).
- `sessionStorage` per tab: tab baru tidak membawa `user`, sehingga guard klien akan menolak sampai login ulang di tab itu (sama seperti seluruh aplikasi).

Perbandingan opsi:

| Opsi | Cara | Kelebihan | Kekurangan |
|---|---|---|---|
| A. Route tidak ikut build produksi | `notFound()` bila `NODE_ENV==='production'` / menyingkirkan folder dari build | Paling aman | **Bertentangan dengan K4** (superadmin harus bisa membukanya di produksi). |
| B. Guard klien `SuperadminOnly` (pola AdminOnly) + middleware mewajibkan cookie di produksi | `/design` dikeluarkan dari STANDALONE saat produksi; layout membungkus anak dengan guard | Konsisten dengan pola proyek; sederhana; memenuhi K4 | Guard klien bukan keamanan kuat; HTML server tetap terkirim ke pemegang cookie (nilai apa pun). |
| C. B + middleware membaca klaim `role` dari payload JWT (tanpa verifikasi tanda tangan) dan menolak non-superadmin di edge | `atob` payload di middleware | Penolakan lebih awal (tanpa memuat bundle) | Tanpa memverifikasi tanda tangan, klaim bisa dipalsukan; frontend tidak boleh memegang `JWT_SECRET`; menambah kompleksitas. |

**Rekomendasi: Opsi B**, lengkap:
1. `middleware.ts`: hapus `/design` dari `STANDALONE_PATHS` **hanya di produksi**; di dev tetap lolos tanpa login. Implementasi: `const standalone = process.env.NODE_ENV === 'production' ? [] : ['/design']`. (`NODE_ENV` tersedia di middleware/edge saat build.) Di produksi tanpa cookie -> redirect `/login` (perilaku bawaan).
2. `app/design/layout.tsx` tetap server component; isinya dibungkus komponen klien baru `SuperadminOnly` (mis. `components/layout/SuperadminOnly.tsx`, salinan pola AdminOnly dengan `role === 'superadmin'`). Di dalamnya: `if (process.env.NODE_ENV !== 'production') return <>{children}</>` (konstanta ini di-inline Next di bundle klien, sehingga di mode pengembangan tidak ada syarat login/role). Bukan superadmin di produksi -> `router.replace('/dashboard')`.
3. Perlu hook hidrasi: `/design` berada di luar `(dashboard)` sehingga `hydrate()` dari `DashboardLayout` tidak jalan. `SuperadminOnly` memanggil `useAuthStore.getState().hydrate()` sendiri (via `useAuth().hydrate`) di `useEffect`, lalu menunggu `isHydrated`.
4. Teks footer sidebar /design diubah ("Referensi internal — khusus peneliti").
5. Batasan jujur untuk DESIGN.md dan laporan: guard klien tidak menghalangi orang yang memodifikasi `sessionStorage`/cookie; ia mencegah akses biasa. Isi /design adalah konten statis non-sensitif (swatch, contoh komponen, tanpa data pasien/obat/API), jadi risiko kebocoran rendah. Keamanan data tetap di backend (403). Jika di kemudian hari /design memuat data nyata, wajib ganti ke opsi dengan verifikasi server.
6. Konsekuensi alur: karena `sessionStorage` per tab, superadmin sebaiknya masuk dari tab tempat ia login (mengetik `/design` di tab yang sama berfungsi; membuka tab baru memerlukan login ulang). Ini perilaku aplikasi yang ada, bukan bug baru.
7. Opsional (butuh persetujuan Boss, scope creep bila otomatis): tautan "Design System" di Sidebar hanya untuk superadmin. Tidak dimasukkan ke task.

Alternatif cadangan bila Boss kelak menyatakan /design tidak perlu ada di produksi: ganti Opsi B dengan Opsi A (satu baris `notFound()` di layout bila production). Perlu diketahui bahwa itu mengubah K4.

---

## 7. Acceptance criteria (objektif, dapat diuji Tessa)

Definisi garis dasar: tangkapan "sebelum" diambil dari commit **terakhir sebelum T-D2 (penambahan token)**, supaya perubahan teks /design (T-D3) tidak mengacaukan perbandingan halaman aplikasi. /design dinilai terpisah (AC-DS-2).

| ID | Kriteria | Cara uji | Lulus bila |
|---|---|---|---|
| AC-DS-1 | **Tampilan aplikasi tidak berubah.** Tangkapan layar halaman utama sebelum vs sesudah migrasi identik byte-per-byte. | Mode data mock/tetap (akun admin dan staf bila relevan), viewport **1366x768** dan **390x844**, halaman: login, dashboard, obat, obat/tambah, obat/[id]/detail, barang-masuk, barang-keluar, laporan, supplier, users, pengaturan, monitoring, reorder; animasi dimatikan (emulasi `prefers-reduced-motion`, tunggu jaringan idle), font termuat, skala 1x. Bandingkan hash PNG/piksel. | Semua pasangan identik. Selisih satu piksel = gagal; investigasi per kelompok. |
| AC-DS-1b | Bukti CSS: nilai deklarasi utilitas baru sama dengan lama. | Untuk tiap token alias, di CSS keluaran `.bg-brand-600` memiliki `background-color` yang sama dengan `.bg-blue-600` (dibandingkan sebelum menghapus yang lama), demikian seterusnya untuk satu wakil tiap token. | Semua identik. |
| AC-DS-2 | /design tetap terbuka dan lengkap (12 bagian lama + Motion + Progres), tanpa error konsol. | Buka `/design` di dev; klik tiap anchor. | 14 bagian muncul, 0 error. Teks px radius sesuai kode (lg 10px, xl 14px). |
| AC-DS-3 | `npx tsc --noEmit` dan `npm run build` lolos. | Jalankan di `simo/` (frontend). | Exit code 0 keduanya. |
| AC-DS-4 | Lint tidak menambah error. | `npm run lint` sebelum T-D2 dan setelah T-D6; bandingkan jumlah error/warning. | Error sesudah <= sebelum. |
| AC-DS-5 | Tidak ada kelas Tailwind warna yang dimigrasi tersisa di berkas cakupan. | Grep regex pola 3.5 untuk setiap kelompok pada `app` (termasuk /design), `components`, `lib`. | 0 sisa untuk: seluruh `blue-*`, `red-*`, `emerald-*`, `orange-*` pada utilitas warna; pasangan netral yang dimigrasi (tabel 3.3). Sisa yang disengaja (3.4) tercatat dan jumlahnya cocok daftar di DESIGN.md. |
| AC-DS-6 | Token benar-benar sumber tunggal (bukti perilaku). | Ubah sementara `--color-brand-600` (mis. ke merah) di `globals.css`, jalankan dev, lihat dashboard/tombol/nav. | Tombol primer, nav aktif, dan tautan biru berubah; kembalikan nilai, build ulang, AC-DS-1 kembali lulus. |
| AC-DS-7 | Nama token di `globals.css` sama dengan tabel di DESIGN.md. | Bandingkan daftar `--color-*` baru dengan DESIGN.md 2.1. | Satu-satu, tanpa selisih. |
| AC-DS-8 | `docs/DESIGN.md` satu-satunya sumber panduan. | Cek: `docs/07-ui-guidelines.md` tidak ada; `docs/FE-AGENT.md` <= 40 baris dan memuat tautan ke DESIGN.md + aturan wajib (5.3); tidak ada folder `docs/ui-design-reference`; rujukan di `02-folder-structure.md`, `README.md`, `pm/PLAN.md` mengarah ke DESIGN.md. | Semua terpenuhi, grep `07-ui-guidelines` = 0 di luar riwayat. |
| AC-DS-9 | Aturan wajib FE-AGENT terbawa. | Periksa DESIGN.md memuat butir 5.3 (1-10), tabel kontras WCAG utuh dengan rasio. | Semua butir ada. |
| AC-DS-10 | Progres penataan tampil dan sesuai DESIGN.md. | Bandingkan tabel di /design dengan DESIGN.md bagian 8. | Jumlah baris dan status sama. |
| AC-DS-11 | Akses /design di **produksi**: hanya superadmin. | `npm run build` + `npm start`. (a) tanpa cookie -> redirect `/login`. (b) login admin -> `/design` mengalihkan ke `/dashboard`. (c) login staf -> sama. (d) login superadmin (akun peneliti) di tab yang sama -> `/design` tampil. | (a)-(d) sesuai. |
| AC-DS-12 | Akses /design di **pengembangan**: terbuka bebas. | `npm run dev`; buka `/design` tanpa login dan sudah login (peran mana pun). | Tampil tanpa redirect. |
| AC-DS-13 | Tidak ada perubahan di luar cakupan. | `git diff --stat` terhadap commit awal. | Tidak ada perubahan di `backend/`, `database-migrations/`, logic hooks/store/api; perubahan `lib/` hanya bila disetujui (tailwind-merge, 3.5). |
| AC-DS-14 | Pengelolaan `cn()`/tailwind-merge. | Satu komponen dengan `className` menimpa warna bawaan memakai token baru. | Hanya satu kelas warna tersisa di DOM (periksa atribut `class`). |
| AC-DS-15 | Halaman error/404 dan modal tetap sama. | Tangkapan layar `/rute-tidak-ada` dan satu `ConfirmDialog`/`alert-dialog` terbuka, 1366 dan 390. | Identik. |

Catatan Tessa: pengambilan layar byte-identik rapuh terhadap antialiasing/font. Lakukan dua tangkapan "sebelum" pada commit yang sama lebih dulu untuk memastikan alat uji deterministik; kalau dua tangkapan sebelum saja sudah berbeda, fokus pada piksel bermakna dan lapor ke Sylpha agar AC-DS-1 disesuaikan lewat jalur revisi.

---

## 8. Pembagian tugas dan urutan untuk Kiri

Semua berkas di bawah relatif ke `D:\skripsi new\simo\`. Tidak ada task yang menyentuh `backend/` atau `database-migrations/`. Tidak ada commit/push tanpa izin Boss.

Urutan wajib: T-D0 -> T-D1 -> T-D2 -> T-D3 (paralel dengan T-D4 bila berkas berbeda) -> T-D5 (migrasi per kelompok) -> T-D6. Migrasi (T-D5) SETELAH T-D3 karena menyentuh berkas `app/design/**`.

| Task | Isi | Berkas yang disentuh | Bergantung pada |
|---|---|---|---|
| **T-D0** Garis dasar | Jalankan pencacah regex (pola 3.5) dan simpan hasil; tangkapan layar "sebelum" (AC-DS-1); catat jumlah error lint, `tsc`, build. Tidak mengubah berkas proyek. | (tidak ada) | -- |
| **T-D1** Dokumen | Tulis `docs/DESIGN.md` (struktur 4.2, nilai token sesuai 3.3, aturan 5.3, Progres 5.2, Motion 6.2, tabel konflik diputuskan dengan 4.1); verifikasi butir bertanda "perlu verifikasi" (responsif, helper format, px radius di browser). Ganti isi `docs/FE-AGENT.md` jadi penunjuk (<= 40 baris, memuat aturan 5.3 ringkas). Hapus `docs/07-ui-guidelines.md`. Perbarui rujukan: `docs/02-folder-structure.md`, `docs/README.md`, `docs/pm/PLAN.md`. Folder gambar (5.4): **tidak ada pemindahan**; `docs/ui-design-reference/` sudah dihapus, `docs/design-reference/` dibiarkan apa adanya. | `docs/DESIGN.md` (baru), `docs/FE-AGENT.md`, `docs/07-ui-guidelines.md` (hapus), `docs/02-folder-structure.md`, `docs/README.md`, `docs/pm/PLAN.md`, (`docs/design-reference/` tidak disentuh) | T-D0 |
| **T-D2** Token | Tambah blok `@theme inline` (3.2) ke `globals.css` TANPA mengganti pemakaian apa pun; buktikan (a)(b) 3.2 (AC-DS-1b). Jangan menyentuh blok shadcn lama. Boleh menghapus blok `@layer base :root` HSL mati hanya bila terbukti tidak mengubah build (opsional; default: biarkan, catat di DESIGN.md). | `simo/app/globals.css` | T-D0 |
| **T-D3** /design | (1) bagian Motion baru (`app/design/motion/section.tsx`), (2) bagian Progres (`app/design/progres/section.tsx` + `data.ts`), (3) grup menu "Workspace" + penanda versi + teks tautan DESIGN.md di `layout.tsx`/`page.tsx`, (4) koreksi konten usang (px radius, judul halaman, footer, swatch green/emerald), (5) bagian Warna menampilkan token tingkat 2. | `simo/app/design/layout.tsx`, `page.tsx`, `_components.tsx`, `warna/section.tsx`, `radius-elevasi/section.tsx`, `tipografi/section.tsx`, `motion/section.tsx` (baru), `progres/section.tsx` + `data.ts` (baru) | T-D1 (agar angka/teks selaras DESIGN.md), T-D2 (untuk Warna) |
| **T-D4** Akses | `components/layout/SuperadminOnly.tsx` (baru), bungkus `app/design/layout.tsx` (bagian layout, bukan konten), ubah `middleware.ts` sesuai 6.5. | `simo/components/layout/SuperadminOnly.tsx` (baru), `simo/middleware.ts`, `simo/app/design/layout.tsx` | T-D3 (berbagi `layout.tsx`: kerjakan berurutan, bukan paralel) |
| **T-D5a..g** Migrasi token | Satu kelompok per langkah (3.5): a brand, b danger, c success, d warning, e permukaan, f garis, g teks. Cakupan: `simo/app/**` (termasuk /design), `simo/components/**`. Setelah tiap langkah: tsc, build, hitung sisa, tangkapan layar (AC-DS-1). Bila gagal, kembalikan kelompok itu saja. Uji kasus tailwind-merge (AC-DS-14); bila perlu tambah `extendTailwindMerge` di `lib/utils.ts` (laporkan ke Niki). | `simo/app/**/*.tsx`, `simo/components/**/*.tsx` (tidak termasuk `components/ui` shadcn murni: `button, badge, card, dropdown-menu, input, label, progress, select, separator, sonner, table`); `simo/lib/utils.ts` hanya bila perlu | T-D2, T-D3, T-D4 |
| **T-D6** Penutupan | Perbarui DESIGN.md bagian Warna/penyimpangan dengan jumlah sisa nyata, Progres, versi; lengkapi laporan SERAH TERIMA dengan angka sebelum/sesudah. | `docs/DESIGN.md`, `simo/app/design/versi.ts` atau `_components.tsx` | T-D5 |

Pembagian berkas agar tidak bentrok: dokumen (`docs/**`) hanya T-D1 dan T-D6; `globals.css` hanya T-D2; `app/design/**` hanya T-D3, T-D4 (layout), lalu T-D5; `middleware.ts` hanya T-D4; berkas halaman dan komponen hanya T-D5. T-D1 dan T-D2 boleh paralel (berkas berbeda); T-D3 dan T-D4 tidak (sama `layout.tsx`).

### 8.1 Estimasi risiko

| Risiko | Tingkat | Alasan / mitigasi |
|---|---|---|
| Perubahan piksel tak sengaja pada migrasi | Sedang | Mitigasi: alias ke variabel bawaan, bukan salinan; migrasi per kelompok; AC-DS-1/1b. Dampak ke data: tidak ada. |
| Kelas tak dikenal karena salah ketik | Rendah-sedang | Tampil tanpa gaya tanpa error. Mitigasi: grep daftar skala sah + screenshot. |
| tailwind-merge tidak menggabungkan warna baru | Rendah-sedang | AC-DS-14; solusi kecil bila terbukti. |
| Alias `@theme inline` tidak ter-resolve seperti diharapkan di Tailwind 4.3.0 | Rendah | Cadangan literal oklch/`@theme static` (3.2). Dibuktikan dini di T-D2, sebelum migrasi. |
| Screenshot byte-identik rapuh (font/antialias) | Sedang (untuk proses uji) | Dua tangkapan sebelum untuk uji determinisme; revisi AC lewat Sylpha. |
| Guard /design memblokir superadmin di tab baru | Rendah | Perilaku sessionStorage yang sudah ada; didokumentasikan. |
| Beban review diff besar (ribuan baris berubah, perubahan nama) | Sedang | Per kelompok, satu commit per kelompok (setelah izin Boss); diff berupa penggantian nama murni. |
| Dokumen baru jadi usang lagi | Sedang | Aturan "satu sumber" + Riwayat versi + AC-DS-8; hindari menyalin hex ke dokumen. |

Dampak ke peran: tidak ada perubahan hak akses aplikasi; hanya `/design` mendapat batas peran. Dampak ke API/data lama: nol. Dampak ke UI: nol secara desain (AC-DS-1).

---

## 9. Pertanyaan terbuka (untuk Niki/Boss)

| No | Pertanyaan | Rekomendasi Sylpha |
|---|---|---|
| P1 | Menyatukan `green` dan `emerald` ("aman") serta `gray-800` ke 700 akan mengubah tampilan. Dikerjakan nanti terpisah? | Tidak dalam tugas ini (K3). Catat sebagai penyimpangan di DESIGN.md. |
| P2 | Tautan ke DESIGN.md di /design: teks jalur saja, atau tautan GitHub? | Teks jalur (tanpa ketergantungan URL repo). |
| P3 | Tautan menu "Design System" di Sidebar khusus superadmin? | Tidak sekarang; superadmin mengetik `/design` di tab yang sama. |
| P4 | Warna di grafik dan PDF (hex) ikut jadi token pada tahap lanjutan? | Ya, sebagai usulan terpisah (3.7). |
| P5 | Dukungan `prefers-reduced-motion` penuh (hanya 1 komponen sekarang) diperbaiki? | Usulan terpisah, bukan bagian tugas ini. |
| P6 | `--primary` shadcn = blue-700 sedangkan brand = blue-600; `Button` shadcn default tampil blue-700. Diselaraskan? | Tidak sekarang (mengubah piksel). Dicatat sebagai penyimpangan. Pemakaian `Button` shadcn tanpa variant perlu dihitung Kiri di T-D0. |
| P7 | Hapus `docs/07-ui-guidelines.md` (rekomendasi) atau diganti penunjuk? | Hapus. |

---

## 10. Ketertelusuran (PRD -> FR/AC)
Surat Tugas tidak bernomor FR; dipetakan seperti berikut.

| Tujuan Boss | Kebutuhan | Task | AC |
|---|---|---|---|
| Satu dokumen sumber tunggal (K1, K2) | FR-DS-1 DESIGN.md; FR-DS-2 FE-AGENT penunjuk; FR-DS-3 satu folder gambar | T-D1, T-D6 | AC-DS-8, AC-DS-9 |
| Token benar-benar dipakai, tampilan sama (K3) | FR-DS-4 token tingkat 2; FR-DS-5 migrasi mekanis | T-D2, T-D5 | AC-DS-1, 1b, 5, 6, 7, 14, 15 |
| /design lengkap (Motion, Progres, versi) | FR-DS-6 | T-D3 | AC-DS-2, AC-DS-10 |
| Akses /design (K4) | FR-DS-7 | T-D4 | AC-DS-11, AC-DS-12 |
| Kualitas teknis | NFR-DS-1 build/tsc/lint; NFR-DS-2 tidak ada perubahan di luar cakupan | semua | AC-DS-3, 4, 13 |

---

## Riwayat revisi
| Versi | Tanggal | Perubahan | Disetujui |
|---|---|---|---|
| 1.0 | 2026-11-10 | Draf awal spesifikasi | Menunggu Niki/Boss |
| 1.1 | 2026-11-10 | Tambah kelas border-t/-l/-x, shadow-*, ring-offset-*; Tahap B per kelompok berkas sah | Sylpha (dicatat sesi utama) |
