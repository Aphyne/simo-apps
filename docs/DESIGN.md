# DESIGN — Sumber Tunggal Design System SIMO

Versi 2.18 · 19 Nov 2026 · Gaya: Flat + Bento · Keputusan per halaman: `docs/design/halaman/`

Dokumen ini satu-satunya panduan desain SIMO (Sistem Informasi Manajemen Persediaan Obat, Apotek Rezky Medika). Ia berisi **nama dan peran** token, pola komponen, dan daftar penyimpangan yang diketahui. **Nilai warna tidak ditulis di sini**: nilai hanya ada di `simo/app/globals.css` (kecuali tabel rasio kontras di 2.2, yang berupa angka rasio hasil ukur).

Versi 2.0 menggantikan v1 (Inter, kartu bergaris dan bershadow, ikon dalam lingkaran, nav aktif biru pekat). Halaman yang belum dimigrasi masih bergaya v1 di dalam shell v2 (lihat 5 dan 6).

## 0. Tujuan dan alur

Alur satu arah: **token (`simo/app/globals.css`) → halaman `/design` → `docs/DESIGN.md`**.
1. `globals.css` menyimpan nilai. Komponen v2 memakai token shadcn (`bg-card`, `text-muted-foreground`, `bg-primary`).
2. Halaman `/design` (`simo/app/design/`, rute `/design`) memperlihatkan token dan komponen secara hidup; nilai warna dibaca langsung dari CSS. Publik tanpa login sejak 24 Nov 2026 (keputusan Boss), di alamat **simoo.online/design**: isinya statis (token dan contoh komponen), tanpa data apotek. `middleware.ts` membukanya (`STANDALONE_PATHS`), dan `lib/domain.ts` mengizinkannya di domain utama.
3. Dokumen ini menjelaskan aturan dan peran. Bila bertentangan dengan `globals.css`, `globals.css` yang benar.

### Aturan wajib untuk agent dan pengembang
1. Baca dokumen ini penuh sebelum menyentuh UI.
2. Hanya ubah tampilan (JSX + kelas). **Jangan ubah** logic, hooks, fetch, API, validasi, types, kecuali diminta.
3. Skill desain eksternal dilarang tanpa izin eksplisit Boss (lihat 7).
4. Satu halaman selesai dan di-acc Boss, baru halaman berikutnya; setelah di-acc, perbarui Progres (6) dan `simo/app/design/progres/data.ts`.
5. Kode v2 memakai **token shadcn** (1.1). Jangan hex di JSX/CSS; grafik memakai `var(--chart-N)`. Butuh warna baru: tambah token di `globals.css` dulu.
6. Komponen dasar dari shadcn (`simo/components/ui/`): Button, Card, Table, Badge, Input, Select, Dialog, DropdownMenu, Progress, Field, Tooltip, Skeleton, Tabs, Textarea, Switch. Pola halaman bersama ada di `simo/components/shared/` (4.8). Pakai ulang sebelum membuat baru. Catatan pemasangan: CLI shadcn menulis `import { cn } from "cn"` (paket npm lain, bukan milik proyek); ganti ke `@/lib/utils` dan jangan pasang paket `cn`.
7. Font Figtree; ikon hanya Lucide.
8. Target sentuh minimal 44px untuk navigasi dan tombol ikon; kontras teks minimal 4,5:1 (2.2).
9. Satu ubin berwarna biru pekat per tampilan, dan hanya untuk hal yang paling perlu dikerjakan.
10. Tidak ada gradasi. Tidak ada label kapital atau berjarak huruf. Tidak ada kartu di dalam kartu.

## 1. Token (nama dan peran)

### 1.1 Token v2 (shadcn, dipakai halaman v2 dan komponen `ui/`)

Didefinisikan di blok `:root` kedua di `globals.css` (oklch) dan dipetakan di `@theme inline`.

| Token (kelas contoh) | Peran |
|---|---|
| `background` (`bg-background`) | Kanvas halaman, sidebar, header (abu muda bersuhu dingin) |
| `card` (`bg-card`) | Ubin dan panel (putih datar), pil menu aktif |
| `foreground` | Judul, angka utama |
| `muted-foreground` | Label, keterangan, sumbu grafik |
| `muted` | Skeleton, jalur progres, chip |
| `border` | Garis tipis di dalam panel (pemisah baris) |
| `input` | Tepi input dan tombol outline |
| `primary` / `primary-foreground` | Aksi utama, tautan, angka yang ditekankan, ubin biru, cincin fokus |
| `accent` / `accent-foreground` | Biru lembut: hover menu, badge hitungan, avatar |
| `secondary` | Netral sekunder |
| `destructive` | Merah: status Habis dan Kritis, aksi menghapus |
| `ring` | Cincin fokus |
| `chart-1..5` | Warna grafik. 1 = data utama (biru), 2 = pembanding (slate), 3..5 hanya bila perlu seri tambahan |
| `kategori-1..14` | Warna irisan donat distribusi kategori obat (14 kategori). Sengaja tanpa merah dan oranye (milik status stok). Hanya untuk membedakan irisan; nama dan jumlah selalu tertulis. Dipakai lewat `var(--kategori-N)` |

### 1.2 Token status stok (alias lama, tetap dipakai)

`danger-*` (merah) dan `warning-*` (oranye) dari blok token v1 dipakai **hanya** untuk status stok dan tanggal expired mendesak: teks `danger-700`/`danger-600`, `warning-700` dengan latar `warning-50`. Aman tidak diberi warna.

### 1.3 Token v1 (halaman yang belum dimigrasi)

`brand-*`, `danger-*`, `success-*`, `warning-*`, `fg*`, `surface*`, `line*` (alias skala warna Tailwind) masih dipakai halaman v1. Jangan dipakai pada kode v2 baru, kecuali `danger-*` dan `warning-*` untuk status (1.2). Dihapus bertahap seiring migrasi.

### 1.4 Radius, font, elevasi
- `--radius` = 0.625rem. Pola: ubin dan panel `rounded-2xl` (18px); tombol aksi halaman dan item menu `rounded-xl` (14px); kontrol kecil `rounded-md`; badge `rounded-full`.
- Font: `--font-sans` dan `--font-heading` = **Figtree** (`next/font`, variabel `--font-figtree`). Mono (`font-mono`) hanya untuk kode obat dan nilai kode.
- Elevasi: **datar**. Ubin dan panel putih di atas kanvas, dipisahkan jarak 16px, tanpa garis dan tanpa bayangan. Bayangan hanya untuk yang melayang: menu dan popover `shadow-md ring-1`, dialog `shadow-lg ring-1`.

## 2. Prinsip dan aksesibilitas

### 2.1 Prinsip
- Flat + Bento: ubin putih modular di atas kanvas abu muda; hierarki lewat ukuran dan berat huruf, bukan dekorasi.
- Dua keluarga warna: biru untuk aksi dan data utama, slate untuk yang lain. Merah dan oranye hanya untuk status stok dan selalu disertai teks.
- Angka tabular (`tabular-nums`). Label, kepala tabel, dan keterangan memakai huruf biasa.
- Keadaan lengkap: memuat (skeleton), kosong, gagal, dan penuh. Data yang gagal dimuat tampil "-", **tidak** sebagai 0 atau "aman".
- Motion hanya untuk keadaan, dan berhenti bila sistem meminta (`motion-safe:`).

### 2.2 Kontras dan target sentuh (hasil ukur di browser, 13 Nov 2026)
Teks yang dibaca harus rasio **>= 4,5:1** (WCAG 2.1 AA). Diukur dari warna terhitung di browser terhadap latar efektif.

| Elemen | Rasio | Catatan |
|---|---|---|
| Teks utama, judul panel | 16,2 sampai 17,8 | |
| Label, keterangan, kepala tabel | 7,4 | `muted-foreground` |
| Item menu tidak aktif | 6,4 | `foreground/70` di atas kanvas |
| Tautan panel (biru) | 5,2 | |
| Badge Kritis | 5,4 | Teks `danger-700` di atas merah 10%. Sebelumnya 4,0 (gagal), diperbaiki |
| Badge Habis (putih di merah) | 4,8 | |
| Badge Mendekati ROP | 4,9 | |
| Tanggal expired merah | 4,8 | |
| Teks di ubin biru | 4,9 | Putih penuh. Dengan 90% sebelumnya 4,3 (gagal), diperbaiki |

Target sentuh: item sidebar, tombol Keluar, tombol menu, dan pemicu profil tingginya **44px**. Tombol aksi halaman 40px (di atas minimum WCAG 2.2, di bawah 44px; lebarnya besar).

Hitung rasio dulu untuk warna teks baru. Dikecualikan: ikon murni tanpa teks, dan state `disabled`.

## 3. Cara mengubah tampilan

Ubah nilai token di `simo/app/globals.css` (blok `:root` kedua). Satu perubahan di `--primary`, misalnya, mengubah semua tombol utama, tautan, ubin biru, dan cincin fokus. Setelah mengubah: ukur ulang kontras (2.2), lihat `/design`, jalankan `npm run build`.

Batas: sumber tunggal ini berlaku untuk **kelas Tailwind dan variabel CSS**. Hex di PDF (`lib/export.ts`) belum ikut (lihat 5).

## 4. Pola komponen v2

Rujukan hidup: `/design`. Kode: `simo/components/dashboard/` dan `simo/components/layout/`.

### 4.1 Shell
- **Sidebar** (`components/layout/Sidebar.tsx`): `bg-background`, tanpa garis, lebar `w-64`. Logo SIMO 40px sejajar tepi kiri ikon menu. Item `h-11 rounded-xl px-3 text-sm`, ikon Lucide + teks. Aktif: `bg-card font-semibold text-foreground` dengan ikon `text-primary` dan `aria-current="page"`. Tidak aktif: `text-foreground/70 hover:bg-card/60`. Di layar `< lg` menjadi drawer (fokus terjebak di dalam, Esc menutup).
- **Header**: `bg-background h-16`; nama apotek di kiri; kanan satu pil putih berisi lonceng dan profil (`min-h-11`).
- **Notifikasi lonceng** (`ui/AlertNotification.tsx`, dibangun di `ui/popover.tsx`): panel melayang `w-[22rem] rounded-2xl shadow-md ring-1` (Esc, klik luar, dan fokus kembali ke lonceng ditangani Radix). Lonceng SELALU tampil (dulu hilang saat kosong atau gagal muat, sehingga gagal tampak seperti aman); lencana merah `bg-destructive` hanya bila ada obat di bawah ROP. Isi: judul "Perlu dipesan ulang" + ringkasan (jumlah, berapa yang habis), baris datar dipisah garis tipis (bukan kartu di dalam kartu) berisi nama, `StatusBadge` (Habis/Harus reorder), "Stok N dari ROP N satuan", supplier atau peringatan "Supplier belum diatur". Maksimal 5 teratas menurut `lib/reorderAlert.ts` `urutKeparahan` (sama dengan halaman Reorder); sisanya lewat tombol biru "Lihat semua N di Reorder". Tombol itu hanya untuk admin (halaman Reorder khusus admin); peran lain melihat catatan "Pemesanan dilakukan oleh admin". Keadaan memuat (skeleton), kosong, dan gagal ("Ini bukan berarti stok aman" + Coba lagi) ditulis jujur.
- **Area konten**: `bg-background`, padding `px-4 sm:px-8`. Judul halaman: `text-2xl font-semibold tracking-tight`.

### 4.2 Ubin dan panel
- **Panel** (`dashboard/Panel.tsx`, dari `Card`): `rounded-2xl ring-0`, header `px-5 pb-3 pt-5` berjudul `text-[15px] font-semibold` dan aksi tautan di kanan, isi `px-5 pb-5`. Tanpa garis pemisah header.
- **Ubin angka** (`StatTile`): `rounded-2xl bg-card p-4`; label `text-sm text-muted-foreground` dengan ikon Lucide 16px (tanpa kotak ikon); angka `text-4xl font-semibold tabular-nums`; keterangan `text-sm`. Nilai `null` tampil "-".
- **Ubin prioritas** (`ReorderTile`): satu-satunya ubin biru pekat datar (`bg-primary`), berisi angka, rasio (garis tipis), dan satu tombol putih.
- **Ubin tautan** (`StatTile href`, varian penuh): seluruh ubin menjadi tautan ke halaman asal angkanya (hover `bg-muted/60`, cincin fokus). Dashboard memakainya supaya menjadi pintu ke halaman lain; isi dan urutan Dashboard ada di `docs/design/halaman/dashboard.md`.
- **Grid**: 12 kolom, `gap-4`, bentuk bento (mis. 8/4 untuk sapaan dan ubin prioritas, 7/5 dan 8/4 untuk panel).

### 4.3 Tabel dan status
- **Tabel**: `Table` shadcn di dalam panel. Kepala `text-xs font-medium text-muted-foreground`, huruf biasa. Baris `py-2.5`, garis tipis `border`, hover `bg-muted/50`. Kode obat `font-mono text-xs`. Kolom angka rata kanan, tabular. Di layar sempit kolom pendukung (ROP, Level) disembunyikan.
- **Badge status** (`Badge`): Habis `bg-destructive text-white`; Kritis `variant="destructive"` + `text-danger-700`; Mendekati ROP `bg-warning-50 text-warning-700`; Aman `variant="outline"`; peran dan keterangan netral `variant="secondary"`.
- **Garis level stok**: panjang isi = stok terhadap dua kali ROP, penanda tegak = ROP (gaya bullet chart). Hanya ditampilkan bila ada obat yang stoknya masih tersisa. Angka stok dan ROP tetap tertulis (tidak mengandalkan warna).
- **Urutan keparahan**: Habis, lalu Kritis, lalu Mendekati; dalam satu tingkat, rasio stok/ROP terkecil dahulu, lalu ROP terbesar.
- **Daftar terbatas**: panel yang hanya memuat N teratas mengatakannya ("5 teratas") dan menautkan "Lihat semua N".

### 4.4 Tombol, form, overlay
- **Tombol**: `Button` shadcn. Satu tombol utama (biru) per tampilan; sisanya `outline`/`ghost`; merah hanya untuk menghapus. Aksi halaman: `h-10 rounded-xl px-4` dengan ikon Lucide lewat `data-icon="inline-start"`. Tombol ikon wajib `aria-label`. Label berupa kata kerja.
- **Form**: `Field`, `FieldLabel`, `FieldDescription`, `FieldError` (shadcn) membungkus `Input` atau `Select` setinggi 40px (`h-10 rounded-xl`; pada `SelectTrigger` tambah `data-[size=default]:h-10`). Label selalu di atas field; hint di bawah field sebagai teks (bukan tooltip); error menggantikan hint, berperan alert, dihubungkan dengan `aria-describedby`, dan field diberi `aria-invalid`. Tanda wajib: **bintang merah** (`text-destructive`, `aria-hidden`) plus `sr-only` "(wajib)", dan **satu baris keterangan di atas form** ("* Semua kolom wajib diisi"). Merah di sini adalah konvensi yang paling dikenal untuk tanda wajib dan sengaja menjadi pengecualian atas prinsip "merah hanya untuk status"; bila semua kolom wajib, keterangan satu baris cukup. Detail pola di 4.8.
- **Overlay**: `Dialog` untuk form, `AlertDialog` untuk konfirmasi hapus. `AlertDialogAction`/`Cancel` sudah bergaya v2 (h-10, rounded-xl); `ConfirmDialog` memakai tombol Hapus `bg-destructive text-white`.

### 4.5 Chart
Recharts dengan `var(--chart-N)`. Garis datar `strokeWidth` 2, titik berongga, isian di bawah garis datar transparan (`fillOpacity` 0,08), hanya garis bantu horizontal, tooltip `--popover` dengan tepi `--border`. Legenda selalu tertulis.

### 4.6 Keadaan dan teks
- **Memuat**: skeleton `bg-muted motion-safe:animate-pulse` dengan bentuk isi yang akan datang.
- **Kosong**: ikon Lucide kecil + satu kalimat tentang apa yang belum ada.
- **Gagal**: angka "-", pesan jujur di tiap panel ("belum bisa dimuat", dan "ini bukan berarti stok aman"), plus `GlobalErrorBanner` di layout dengan tombol Coba lagi.
- **Format**: helper di `simo/lib/utils.ts` (`formatRupiah`, `formatAngka`, `formatTanggal`, `formatTanggalPendek`, `formatTanggalInput`). Jangan memformat manual.
- **Motion**: `transition-colors` (hover/fokus), `motion-safe:animate-pulse`/`animate-spin`, animasi dropdown/dialog shadcn. Tanpa animasi dekoratif.

### 4.7 Pola v1 (hanya untuk halaman yang belum dimigrasi)
Kartu `rounded-xl border border-line bg-surface p-5 shadow-sm`, stat card dengan ikon dalam lingkaran tint, tabel berkepala kapital, tombol `bg-brand-600`, paginasi bertombol kecil. Saat sebuah halaman dimigrasi, pola ini diganti pola 4.2 sampai 4.8.

### 4.8 Pola halaman (`simo/components/shared/`, contoh hidup di `/design#halaman`)
Dibuat untuk halaman Data Obat (16 Nov 2026) dan dipakai ulang halaman berikutnya.
- **Kepala halaman** (`PageHeader`): di kanvas, bukan di ubin. Judul `text-2xl font-semibold`; keterangan satu kalimat `text-[15px]`; aksi di kanan (satu biru, sisanya outline), turun ke bawah judul di layar sempit. Varian detail: tombol kembali 44px di atas judul, dan baris meta (kode `font-mono` dalam chip abu, kategori, badge status). Perilaku kembali ditentukan halaman lewat `onBack`.
- **Bilah filter** (`FilterBar`, `SearchField`, `FILTER_SELECT`): satu baris di dalam panel tabel, di atas tabel: kolom cari, Select (kategori dengan jumlah per pilihan, status), tombol "Atur ulang" (ghost, hanya muncul saat ada filter aktif), dan aksi utama biru di kanan (`sm:ml-auto`). Semua kontrol 40px, radius xl. Filter dengan banyak nilai memakai Select, bukan deretan chip (chip membungkus jadi beberapa baris dan memanjangkan panel). Di layar sempit: grid 2 kolom, cari dan tombol selebar penuh, dua Select berdampingan. Setiap perubahan filter mengembalikan paginasi ke halaman 1. Halaman daftar yang punya bilah filter menaruh tombol utamanya di bilah itu, bukan di kepala halaman. **Filter, urutan, dan halaman disimpan di URL** (`?q=&kategori=&status=&expired=&urut=&arah=&hal=`) lewat `useSearchParams` dan `router.replace`, sehingga tidak hilang saat kembali dari halaman detail dan bisa dibagikan; halaman yang memakainya harus dibungkus `<Suspense>` di `page.tsx`. Kolom cari memakai state lokal dan baru masuk ke URL setelah jeda 300 ms. Nilai URL yang tidak dikenal diabaikan, dan nomor halaman di luar jangkauan menampilkan "Halaman ini tidak ada" dengan tombol ke halaman pertama.
- **Tabel berpanel**: `Panel` dengan `bodyClassName="px-0 pb-0"`; kepala `h-10 text-xs font-medium text-muted-foreground`; sel pertama memuat nama (tautan ke detail, hover biru) dan kode `font-mono` di bawahnya. Kolom pendukung muncul bertahap menurut **lebar konten**, bukan lebar layar: sidebar 256px muncul mulai `lg`, jadi konten di `lg` sama sempitnya dengan di `md`. Selalu: nama, angka utama, aksi (status mulai `md`; di bawah `md` badge status ikut di bawah nama). `xl` (konten sekitar 960px): kolom angka pendukung dan tanggal. `2xl`: kolom paling sekunder (kategori, EOQ). Tabel tetap bisa digulir. Kerangka pemuatan memakai `Skeleton` dengan jumlah kolom dan baris yang sama dengan isi, dan `aria-busy` pada pembungkus. Istilah teknis di kepala kolom (ROP, EOQ) dibungkus Tooltip yang bisa difokus keyboard. Tingkat mendesak ditandai ikon `TriangleAlert` selain warna, dan yang sudah lewat tertulis "Sudah expired". Keterangan arti warna dan arti garis level ditulis satu paragraf di bawah panel; sel berwarna juga memuat teks `sr-only`. Jumlah hasil diumumkan lewat `role="status"` sr-only. Tombol ikon "lihat detail" disembunyikan di layar sempit untuk admin (nama sudah menjadi tautan). **Kepala kolom bisa diurut** (`KepalaUrut`): tombol dengan ikon panah 14px, `aria-sort` pada selnya; klik pertama menaik, kedua menurun, ketiga kembali ke bawaan (nama A-Z). Pengurutan dikerjakan backend (parameter `sort` dan `arah`, lihat `04-api-endpoints.md`) karena paginasi di server; mengurutkan hanya sepuluh baris di halaman ini akan menyesatkan. Keadaan gagal memuat menawarkan satu aksi "Coba lagi" (ulang kedua permintaan).
- **Paginasi** (`Pagination`, `getPageNumbers`): di kaki panel, bergaris atas. Ringkasan "1-10 dari 49 obat" di kiri (`aria-live`); tombol 40px di kanan; halaman aktif biru dengan `aria-current="page"`. Di layar sempit nomor diganti "Halaman X dari Y". Hanya tampil bila halaman lebih dari satu.
- **Tombol ikon di baris** (`IconAction`): 40px, `aria-label` menyebut sasaran ("Ubah Paracetamol 500mg"), dengan Tooltip. Hapus berwarna destructive dan membuka `ConfirmDialog`. Tooltip tidak muncul di layar sentuh; label tetap ada untuk pembaca layar.
- **Halaman Data Obat** (daftar, tambah, detail, ubah): ringkasan donat dan batang status, kisi fakta, angka utama di detail, hasil perhitungan EOQ/ROP, dan aturan form tambah/ubah (berlaku untuk semua form SIMO). Rincian lengkap: [`docs/design/halaman/data-obat.md`](design/halaman/data-obat.md).
- **Ubin ringkasan ringkas** (`StatTile compact`, `ReorderTile compact`): untuk halaman daftar, supaya tabel sudah terlihat di layar pertama. Baris label `min-h-9`, lalu angka `text-3xl` dan keterangan sejajar; sekitar 106px tinggi. Empat ubin satu baris di `lg`; ubin biru memuat tombol 36px di kanan label. Dashboard tetap memakai ubin penuh (4.2).
- **Halaman Stok masuk** (`/barang-masuk`): ubin, grafik tren dan peringkat, riwayat Per obat dan Per faktur, form banyak baris, kebijakan harga. Rincian lengkap: [`docs/design/halaman/stok-masuk.md`](design/halaman/stok-masuk.md).
- **Halaman Stok keluar** (`/barang-keluar`): ubin penjualan, hanya penjualan dihitung pendapatan, form daftar obat, tampilan Per transaksi. Rincian lengkap: [`docs/design/halaman/stok-keluar.md`](design/halaman/stok-keluar.md).
- **Halaman Reorder** (`/reorder`): daftar dan keranjang berdampingan, ubin pintasan filter, keranjang bertahan di sessionStorage. Rincian lengkap: [`docs/design/halaman/reorder.md`](design/halaman/reorder.md).
- **Halaman Laporan** (`/laporan`): lima tab, filter di URL, tabel dan aksi ekspor di kepala panel, pratinjau dan PDF. Rincian lengkap: [`docs/design/halaman/laporan.md`](design/halaman/laporan.md).
- **Halaman Pengaturan** (`/pengaturan`): empat ubin bagian form, bilah simpan menempel yang memberi tahu ada perubahan, pemeriksaan angka sama dengan backend. Rincian lengkap: [`docs/design/halaman/pengaturan.md`](design/halaman/pengaturan.md).
- **Halaman Manajemen user** (`/users`): tabel berpanel, tiga ubin, dialog Tambah, Ubah, dan Reset password dengan input password bertombol tampilkan. Rincian lengkap: [`docs/design/halaman/users.md`](design/halaman/users.md).
- **Halaman Supplier** (`/supplier/**`): kartu per supplier (bawaan) dengan tombol Kartu | Tabel, tiga ubin, form dengan pasangan kontak. Rincian lengkap: [`docs/design/halaman/supplier.md`](design/halaman/supplier.md).
- **Halaman depan** (`/`, 24 Nov 2026): untuk calon pengguna, terbuka tanpa login, bahasa visual sendiri (editorial serif, panggung gelap, navbar pil kaca, foto produk asli), tempat video demo YouTube. Rincian lengkap: [`docs/design/halaman/landing.md`](design/halaman/landing.md).
- **Peran Staf** (19 Nov 2026): tanpa uang yang tersimpan (dibuang di backend; staf boleh mengisi harga di Stok masuk, hanya menulis), tanpa Tambah obat, boleh membatalkan catatan stok buatannya sendiri dalam 10 menit, Dashboard dengan panel Obat hampir habis. Rincian: [`docs/design/halaman/staf.md`](design/halaman/staf.md).
- **Istilah teknis (`shared/Istilah.tsx`, 18 Nov 2026)**: istilah seperti ROP, EOQ, dan Service level ditulis bergaris titik-titik dan bisa difokus keyboard; penjelasan dalam bahasa sehari-hari muncul saat disorot atau difokus dan dibacakan pembaca layar. **Penjelasan muncul ke bawah** (bawaan): di kepala tabel, ke atas menutupi bilah filter di atasnya (temuan Boss pada tabel Data Obat). Tooltip tidak muncul di layar sentuh, jadi arti yang penting juga ditulis sebagai keterangan di bawah kolom (mis. Service level di Pengaturan). Satu komponen untuk semua halaman; jangan menulis tooltip istilah sendiri.
- **Pola bersama di kode (18 Nov 2026)**: tiga bagian dipakai ulang supaya perubahan pola cukup di satu tempat. (1) `useFilterUrl` dan `useCariTertunda` (`components/shared/useFilterUrl.ts`): filter, urutan, dan halaman di URL lewat History API, kolom cari dengan jeda 300 ms; halaman yang memakainya dibungkus `<Suspense>`. Dipakai Data Obat, Stok masuk, Stok keluar, Reorder, Supplier, dan Laporan. (2) `TabelSkeleton` (`shared/TabelSkeleton.tsx`): kerangka pemuatan tabel dari daftar kolom (lebar garis, kolom bertahap, rata kanan, bentuk badge atau tombol). (3) `TabelData` (`shared/TabelData.tsx`): tabel generik untuk daftar yang dimuat penuh di klien, yaitu kolom bertahap menurut lebar konten, kerangka, keadaan kosong dan gagal yang jujur, baris penutup total, dan paginasi di klien (`perHalaman={Infinity}` untuk tanpa paginasi). Dipakai Laporan, Supplier, dan daftar Reorder. Tabel yang paginasinya di server atau barisnya punya interaksi khusus (Data Obat dengan pengurutan, Stok masuk, Stok keluar) memakai `Table` langsung dan hanya berbagi `TabelSkeleton` dan hook. Halaman baru: pakai ketiganya dulu sebelum menulis ulang.
- **Keadaan** (`StateMessage`): ikon 24px, satu kalimat tebal, satu kalimat arah, dan satu aksi. Kosong mengajak mengisi; tidak cocok menawarkan "Atur ulang filter"; gagal menyatakan bahwa itu bukan berarti datanya nol.
- **Bagian form** (`FormSection`, `FormActions`): form satu bagian tanpa judul bagian dan tanpa nomor; form banyak bagian memakai `FormSection` (judul `text-[15px] font-semibold` + keterangan). Bilah aksi di kaki bergaris atas: Batal (outline) lalu aksi utama (biru) di kanan; bertumpuk di layar sempit.
- **Lebar halaman**: daftar dan detail `max-w-7xl` bergrid 12 kolom; form `max-w-3xl` dalam satu ubin `rounded-2xl bg-card p-5 sm:p-6`. Form yang sama dipakai di `Dialog` (Dashboard), jadi `ObatForm` tidak membawa pembungkus ubinnya sendiri.

## 5. Penyimpangan yang diketahui (jujur, per 13 Nov 2026)

1. **Isi sebagian besar halaman masih gaya v1** (token `brand/fg/surface/line`, kartu bergaris, uppercase). Hanya Dashboard, `/design`, dan shell yang v2 (6). Hasilnya tampak tidak seragam sampai halaman lain dimigrasi.
2. **Sidebar memuat 9 item datar** tanpa pengelompokan (panduan skill: hierarki navigasi dan batas jumlah item). Pengelompokan belum diusulkan atau dikerjakan.
3. ~~`alert-dialog.tsx` dan `ConfirmDialog` masih v1~~ Diperbaiki 16 Nov 2026 (v2.1): bergaya v2 dan ikut berubah di halaman lain yang memakainya (`/supplier`, `/barang-masuk`, `/barang-keluar`). `StatusBadge` (`components/ui/`) dan `RumusDisplay` juga sudah v2 dan ikut berubah di `/perhitungan`, yang isinya masih v1.
4. **`GlobalErrorBanner` dan `ErrorPanel`** masih bergaya v1.
5. **Blok `.dark` dihapus** dari `globals.css` (aplikasi hanya mode terang; blok lama tidak pernah aktif). `next-themes` hanya dipakai `sonner`.
6. **Dua blok `:root` di `globals.css`**: blok pertama (`@layer base`, HSL) kode mati, kalah oleh blok kedua (oklch).
7. **Hex di luar token**: PDF `lib/export.ts` (larik RGB) dan grafik Recharts pada halaman v1 masih literal.
8. **`prefers-reduced-motion`**: kode v2 memakai `motion-safe:`; halaman v1 masih sebagian.
9. **Sisa kelas warna lama** (cacahan 10 Nov 2026): 276 kemunculan di 53 berkas, 99 pasangan konflik kaskade; belum dihitung ulang setelah v2.
10. **Halaman nonaktif**: Monitoring, Simulasi, dan Perhitungan dinonaktifkan (19 Nov 2026): menu dikomentari di Sidebar dan alamatnya dialihkan ke Dashboard; isi lama dipulihkan dari git (lihat komentar di tiap `page.tsx`). Analisis Komparatif kini menu khusus peneliti (superadmin).
11. **Uji tampilan** (`qa-tools/e2e/04-tampilan.spec.js`): teks di dalam `<select>` bawaan browser ditutup mask karena antialiasing-nya berkedip antar-run.
12. **Belum dicocokkan dengan data produksi**: angka pendapatan hari ini (jumlah × `harga_jual`) di Dashboard.

## 6. Progres penataan (v2)

Sumber satu-satunya checklist halaman. "Mengikuti" = isi halaman sudah memakai token dan pola v2. Sidebar, header, latar, dan huruf sudah v2 di semua halaman, jadi "Belum" hanya berarti isinya masih gaya v1. "Nonaktif" = menu dan alamat ditutup (dialihkan ke Dashboard), tidak dihitung dalam persentase. Salinan: `simo/app/design/progres/data.ts`.

| Halaman | Rute / berkas utama | Status | Catatan |
|---|---|---|---|
| Layout (Sidebar + Header) | `components/layout/*` | Mengikuti | Drawer di `< lg`; target sentuh 44px |
| Dashboard | `/dashboard` | Mengikuti | |
| Design (style guide) | `/design` | Mengikuti | Publik tanpa login (simoo.online/design) |
| Data Obat (list, tambah, detail, edit) | `/obat/**` | Mengikuti | Dikerjakan 16 Nov 2026; menunggu acc Boss. Pola baru di 4.8 |
| Barang Masuk (Stok masuk) | `/barang-masuk` | Mengikuti | Dikerjakan 17 Nov 2026; menunggu acc Boss. Pola baru di 4.8 |
| Barang Keluar (Stok keluar) | `/barang-keluar` | Mengikuti | Dikerjakan 18 Nov 2026; menunggu acc Boss. Mengikuti pola Stok masuk (4.8) |
| Monitoring | `/monitoring` | Nonaktif | Menu dan alamat ditutup 19 Nov 2026 (dialihkan ke Dashboard) |
| Perhitungan EOQ/ROP | `/perhitungan` | Nonaktif | Menu dan alamat ditutup 19 Nov 2026 (dialihkan ke Dashboard) |
| Laporan | `/laporan` | Mengikuti | Dikerjakan 18 Nov 2026; menunggu acc Boss. Pola di docs/design/halaman/laporan.md. Lembar kertas pratinjau dan PDF tidak disentuh |
| Simulasi | `/simulasi` | Nonaktif | Menu dan alamat ditutup 19 Nov 2026 (dialihkan ke Dashboard) |
| Analisis Komparatif | `/analisis` | Mengikuti | Dikerjakan 19 Nov 2026; diuji (uji per peran 19 Nov). Hanya superadmin (peneliti); dua skenario dihitung backend dari D, S, H yang sama |
| Supplier (list, tambah, edit) | `/supplier/**` | Mengikuti | Dikerjakan 18 Nov 2026; menunggu acc Boss. Pola di docs/design/halaman/supplier.md |
| Manajemen User | `/users` | Mengikuti | Dikerjakan 18 Nov 2026; menunggu acc Boss. Pola di docs/design/halaman/users.md |
| Pengaturan | `/pengaturan` | Mengikuti | Dikerjakan 18 Nov 2026; menunggu acc Boss. Pola di docs/design/halaman/pengaturan.md |
| Reorder | `/reorder` | Mengikuti | Dikerjakan 18 Nov 2026; menunggu acc Boss. Pola di docs/design/halaman/reorder.md. Format PDF Surat Pesanan tidak disentuh |
| Pemantauan | `/pemantauan` | Mengikuti | Dikerjakan 18-19 Nov 2026; diuji (uji per peran 19 Nov). Hanya superadmin; ubin, grafik, perlu perhatian, dialog pengguna |
| Login | `/login` | Mengikuti | Dikerjakan 18-19 Nov 2026; diuji (uji per peran 19 Nov). Kartu terbelah: panel biru + form v2 |
| Halaman depan (landing page) | `/` | Mengikuti | Dikerjakan 24 Nov 2026 (versi 2, editorial + foto asli); menunggu acc Boss. Bahasa visual sendiri; pola di docs/design/halaman/landing.md |
| Error / not-found | `app/error.tsx`, `not-found.tsx` | Belum | `ErrorPanel` masih gaya v1 |

Hak akses per peran (admin, staf, superadmin) mengikuti aplikasi; UI tidak menjadi sumber keamanan (keamanan di backend).

## 7. Redesign dan referensi

- **Izin skill desain eksternal**: dilarang tanpa izin eksplisit Boss. Izin 13 Nov 2026 (redesign Dashboard dan `/design`): `ui-ux-pro-max`, `hallmark`, `frontend-design`, dan `impeccable`, dengan arahan Boss untuk tidak terikat panduan v1. Izin berlaku untuk tugas itu; migrasi halaman lain perlu persetujuan baru. Izin 16 Nov 2026 (migrasi Data Obat): `ui-ux-pro-max`, `frontend-design`, `impeccable`, dan sloplint dari `hallmark`; Boss juga mengizinkan komponen shadcn baru bila skill menyarankan (terpasang: Field, Tooltip, Skeleton). Izin lama yang sudah dipakai: kartu Distribusi Kategori (commit dfc6495; donut 14 kategorinya diganti pada 16 Nov 2026 dengan donut semua kategori (legenda lima teratas, irisan bisa diklik) dan batang status stok, atas permintaan Boss).
- **Cara migrasi sebuah halaman**: ganti kartu v1 dengan Panel dan ubin (4.2), tabel dengan pola 4.3, tombol dan form dengan shadcn (4.4), lalu cek kontras (2.2), lihat tampilan di HP dan desktop, dan perbarui Progres (6).
- **Fase D (komponen bersama)**: Panel, StatTile, dan ReorderTile ada di `simo/components/dashboard/`; pola halaman (PageHeader, FilterBar, Pagination, FormParts, FactList, StateMessage, IconAction) ada di `simo/components/shared/` sejak 16 Nov 2026 (4.8).

## 8. Riwayat dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-11-10 | Pertama (T-D1): menggantikan `FE-AGENT.md` penuh dan `07-ui-guidelines.md` (dihapus). Berdasarkan token T-D2 dan migrasi Tahap B. |
| 2.18 | 2026-11-19 | Login, Pemantauan, dan Analisis Komparatif kini **Mengikuti** (tabel progres bagian 6 dan `/design/progres`). Peran Staf: tanpa uang yang tersimpan, rincian di `docs/design/halaman/staf.md`. Analisis Komparatif menjadi menu khusus peneliti. Diuji lewat laporan gabungan 19 Nov (196 skenario, 195 lulus, 1 dilewati sengaja). |
| 2.17 | 2026-11-18 | **Semua pilihan dari daftar memakai `PilihanCombobox`** (satu pola, satu perubahan berlaku di semua): filter di Reorder, Stok Masuk, Stok Keluar, Users, Data Obat, Laporan; form (kategori, satuan, supplier, keterangan stok keluar, peran, service level); pemilih bulan dan tahun di grafik. Komponen `ui/select.tsx` tidak lagi dipakai halaman mana pun (hanya contoh di `/design`); jangan memakainya untuk pilihan baru. `PilihanCombobox` mendapat prop `disabled`. Membuat nilai baru (`tambahBaru`) hanya diberikan di form **Tambah** Obat (Dashboard memakai form yang sama); form Ubah hanya memilih yang sudah ada (keputusan Boss). Sebelum pilihan "Tambah ... baru", teks yang hampir sama dengan pilihan yang ada (selisih 1-2 huruf, `cariMirip` di `lib/opsiObat.ts`) menampilkan "Maksud Anda “...”?" dan menjadi pilihan bawaan saat Enter, supaya salah ketik tidak menjadi kategori/satuan baru. |
| 2.16 | 2026-11-18 | `PilihanCombobox` bisa membuat nilai baru (`tambahBaru`): mengetik kategori atau satuan yang belum ada menampilkan pilihan terakhir "Tambah '…' sebagai kategori baru". Daftar = konstanta `lib/constants.ts` + nilai yang sudah dipakai obat (`GET /api/obat/opsi`, `lib/opsiObat.ts`); server menyamakan ejaan dengan yang sudah ada (tanpa membedakan huruf) dan merapikan nilai baru. Filter kategori Laporan tidak lagi menolak kategori di luar daftar baku. |
| 2.15 | 2026-11-18 | Komponen bersama `ui/PilihanCombobox.tsx`: kolom pilihan dari daftar tertutup (kategori, satuan, supplier) dengan pola yang sama dengan kolom cari obat (ketik untuk menyaring, panah, Enter, Esc). Menggantikan `Select` di form Tambah/Ubah Obat dan form Stok Masuk (tambah dan ubah). Filter bertuliskan "Semua" di Laporan (`FilterPilihan`) dan Data Obat (kategori, status stok, expired) juga memakainya, dengan "Semua ..." sebagai pilihan pertama bernilai kosong. |
| 2.14 | 2026-11-18 | Hasil critique kedua Dashboard (28/40): angka uang khusus admin (juga di backend), ubin Habis dalam 7 hari, Terlaris 30 hari terakhir, grafik menandai bulan tidak lengkap dan membuang bulan kosong di awal, kartu Perlu dilengkapi (`dashboard/PerluDilengkapiCard.tsx`). |
| 2.13 | 2026-11-18 | Isi Dashboard disusun ulang (`docs/design/halaman/dashboard.md`): panel Stok menipis dibuang (sudah ada di lonceng), empat ubin berbeda dan berupa tautan, panel Kedaluwarsa (termasuk yang sudah lewat), Aktivitas hari ini (masuk + keluar), grafik Pembelian vs Penjualan (Rp), dan Terlaris bulan ini. `StatTile` mendapat `href`, `teks`, dan `sublabel` bebas. |
| 2.12 | 2026-11-18 | Notifikasi lonceng didesain ulang (`ui/popover.tsx` baru, `lib/reorderAlert.ts` dipakai bersama dengan halaman Reorder): lihat 4.1. |
| 2.11 | 2026-11-18 | Hasil critique Supplier, Manajemen user, Pengaturan: komponen `ui/switch.tsx` (status akun), `shared/useCegatPindah.ts` (konfirmasi saat pindah halaman dengan perubahan belum disimpan), kolom login mematikan kapital otomatis, Pengaturan jadi tiga ubin, ubin Biaya pesan Supplier adaptif. |
| 2.10 | 2026-11-18 | Komponen bersama `Istilah` (penjelasan istilah teknis, muncul ke bawah) menggantikan salinan di Data Obat dan Reorder; Service level di Pengaturan dijelaskan. |
| 2.9 | 2026-11-18 | Migrasi halaman Pengaturan (`docs/design/halaman/pengaturan.md`): empat ubin bagian form, bilah simpan menempel dengan status perubahan, komponen `ui/textarea.tsx`. |
| 2.8 | 2026-11-18 | Migrasi halaman Manajemen user (`docs/design/halaman/users.md`): tabel `TabelData`, form dan reset password berupa dialog, `InputPassword` di `shared/FormParts.tsx`. |
| 2.7 | 2026-11-18 | Bagian 4.8 dipecah: aturan dan pola bersama tetap di DESIGN.md; keputusan khusus tiap halaman dipindah ke `docs/design/halaman/*.md` (data-obat, stok-masuk, stok-keluar, laporan, reorder, supplier). Pola bersama di kode dibuat: `useFilterUrl`, `TabelSkeleton`, `TabelData`. |
| 2.6 | 2026-11-18 | Migrasi halaman Supplier (4.8, butir halaman Supplier): daftar berbentuk tabel berpanel menggantikan kartu, tiga ubin ringkasan, form v2 dengan pasangan kontak, `useAsalHalaman` menerima juga `/supplier`. |
| 2.5 | 2026-11-18 | Migrasi halaman Laporan (4.8, butir halaman Laporan): komponen `Tabs` v2, filter di URL untuk semua tab, `TabelLaporan` dengan paginasi dan baris penutup, dialog pratinjau v2 dengan lembar kertas dan PDF tidak disentuh. |
| 2.4 | 2026-11-18 | Migrasi halaman Reorder (4.8, butir halaman Reorder): daftar dan keranjang berdampingan mulai `xl`, filter supplier berupa Select, keadaan gagal jujur; kode PDF dan WhatsApp tidak disentuh. |
| 2.3 | 2026-11-18 | Migrasi halaman Stok keluar (4.8, butir halaman Stok keluar): pola Stok masuk dipakai ulang, form daftar obat, penjualan sebagai satu-satunya pendapatan, `lib/barangKeluar.ts`, `BarangKeluarTambahDialog`. |
| 2.2 | 2026-11-17 | Migrasi halaman Stok masuk (4.8, butir halaman transaksi): `Segmented`, `Wajib`/`Opsional`/`InputSatuan`, `ExpiredCell` dipindah ke `shared/`, `ObatCombobox` v2 dengan ARIA, daftar peringkat berbatang menggantikan grafik batang per obat, `BarangMasukTambahDialog` dengan konfirmasi buang. |
| 2.1 | 2026-11-16 | Migrasi halaman Data Obat (daftar, tambah, detail, ubah): pola halaman baru (4.8: kepala halaman, bilah filter, paginasi, tombol ikon bertooltip, ubin ringkasan ringkas, kisi fakta, keadaan, bagian form), komponen shadcn Field/Tooltip/Skeleton, `alert-dialog`/`ConfirmDialog`/`StatusBadge`/`RumusDisplay` ke v2, donut 14 kategori dikembalikan dengan legenda lima teratas dan irisan yang memfilter, status stok jadi batang bertumpuk; token `kategori-1..14`. |
| 2.0 | 2026-11-13 | Redesign v2 (Flat + Bento): token shadcn sebagai token halaman v2, huruf Figtree, shell baru (sidebar dan header menyatu dengan kanvas, target sentuh 44px), pola ubin dan panel, status Habis, keadaan gagal, kontras hasil ukur, tabel progres v2. Pola v1 dipindah ke 4.7 dan 5. |
