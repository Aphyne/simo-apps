# DESIGN — Sumber Tunggal Design System SIMO

Versi 2.0 · 13 Nov 2026 · Gaya: Flat + Bento · Spesifikasi lama (v1): `docs/spec/design-system.md` · Penunjuk untuk agent: `docs/FE-AGENT.md`

Dokumen ini satu-satunya panduan desain SIMO (Sistem Informasi Manajemen Persediaan Obat, Apotek Rezky Medika). Ia berisi **nama dan peran** token, pola komponen, dan daftar penyimpangan yang diketahui. **Nilai warna tidak ditulis di sini**: nilai hanya ada di `simo/app/globals.css` (kecuali tabel rasio kontras di 2.2, yang berupa angka rasio hasil ukur).

Versi 2.0 menggantikan v1 (Inter, kartu bergaris dan bershadow, ikon dalam lingkaran, nav aktif biru pekat). Halaman yang belum dimigrasi masih bergaya v1 di dalam shell v2 (lihat 5 dan 6).

## 0. Tujuan dan alur

Alur satu arah: **token (`simo/app/globals.css`) → halaman `/design` → `docs/DESIGN.md`**.
1. `globals.css` menyimpan nilai. Komponen v2 memakai token shadcn (`bg-card`, `text-muted-foreground`, `bg-primary`).
2. Halaman `/design` (`simo/app/design/`, rute `/design`) memperlihatkan token dan komponen secara hidup; nilai warna dibaca langsung dari CSS. Hanya superadmin di produksi; bebas tanpa login di mode pengembangan. Di produksi: tanpa login ke `/login`, admin/staf ke `/dashboard` (dijaga `middleware.ts` dan `simo/components/layout/SuperadminOnly.tsx`; guard sisi klien, bukan keamanan data).
3. Dokumen ini menjelaskan aturan dan peran. Bila bertentangan dengan `globals.css`, `globals.css` yang benar.

### Aturan wajib untuk agent dan pengembang
1. Baca dokumen ini penuh sebelum menyentuh UI.
2. Hanya ubah tampilan (JSX + kelas). **Jangan ubah** logic, hooks, fetch, API, validasi, types, kecuali diminta.
3. Skill desain eksternal dilarang tanpa izin eksplisit Boss (lihat 7).
4. Satu halaman selesai dan di-acc Boss, baru halaman berikutnya; setelah di-acc, perbarui Progres (6) dan `simo/app/design/progres/data.ts`.
5. Kode v2 memakai **token shadcn** (1.1). Jangan hex di JSX/CSS; grafik memakai `var(--chart-N)`. Butuh warna baru: tambah token di `globals.css` dulu.
6. Komponen dasar dari shadcn (`simo/components/ui/`): Button, Card, Table, Badge, Input, Select, Dialog, DropdownMenu, Progress. Pakai ulang sebelum membuat baru.
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
- **Sidebar** (`components/layout/Sidebar.tsx`): `bg-background`, tanpa garis, lebar `w-64`. Item `h-11 rounded-xl px-3 text-sm`, ikon Lucide + teks. Aktif: `bg-card font-semibold text-foreground` dengan ikon `text-primary` dan `aria-current="page"`. Tidak aktif: `text-foreground/70 hover:bg-card/60`. Di layar `< lg` menjadi drawer (fokus terjebak di dalam, Esc menutup).
- **Header**: `bg-background h-16`; nama apotek di kiri; kanan satu pil putih berisi lonceng dan profil (`min-h-11`).
- **Area konten**: `bg-background`, padding `px-4 sm:px-8`. Judul halaman: `text-2xl font-semibold tracking-tight`.

### 4.2 Ubin dan panel
- **Panel** (`dashboard/Panel.tsx`, dari `Card`): `rounded-2xl ring-0`, header `px-5 pb-3 pt-5` berjudul `text-[15px] font-semibold` dan aksi tautan di kanan, isi `px-5 pb-5`. Tanpa garis pemisah header.
- **Ubin angka** (`StatTile`): `rounded-2xl bg-card p-4`; label `text-sm text-muted-foreground` dengan ikon Lucide 16px (tanpa kotak ikon); angka `text-4xl font-semibold tabular-nums`; keterangan `text-sm`. Nilai `null` tampil "-".
- **Ubin prioritas** (`ReorderTile`): satu-satunya ubin biru pekat datar (`bg-primary`), berisi angka, rasio (garis tipis), dan satu tombol putih.
- **Grid**: 12 kolom, `gap-4`, bentuk bento (mis. 8/4 untuk sapaan dan ubin prioritas, 7/5 dan 8/4 untuk panel).

### 4.3 Tabel dan status
- **Tabel**: `Table` shadcn di dalam panel. Kepala `text-xs font-medium text-muted-foreground`, huruf biasa. Baris `py-2.5`, garis tipis `border`, hover `bg-muted/50`. Kode obat `font-mono text-xs`. Kolom angka rata kanan, tabular. Di layar sempit kolom pendukung (ROP, Level) disembunyikan.
- **Badge status** (`Badge`): Habis `bg-destructive text-white`; Kritis `variant="destructive"` + `text-danger-700`; Mendekati ROP `bg-warning-50 text-warning-700`; Aman `variant="outline"`; peran dan keterangan netral `variant="secondary"`.
- **Garis level stok**: panjang isi = stok terhadap dua kali ROP, penanda tegak = ROP (gaya bullet chart). Hanya ditampilkan bila ada obat yang stoknya masih tersisa. Angka stok dan ROP tetap tertulis (tidak mengandalkan warna).
- **Urutan keparahan**: Habis, lalu Kritis, lalu Mendekati; dalam satu tingkat, rasio stok/ROP terkecil dahulu, lalu ROP terbesar.
- **Daftar terbatas**: panel yang hanya memuat N teratas mengatakannya ("5 teratas") dan menautkan "Lihat semua N".

### 4.4 Tombol, form, overlay
- **Tombol**: `Button` shadcn. Satu tombol utama (biru) per tampilan; sisanya `outline`/`ghost`; merah hanya untuk menghapus. Aksi halaman: `h-10 rounded-xl px-4` dengan ikon Lucide lewat `data-icon="inline-start"`. Tombol ikon wajib `aria-label`. Label berupa kata kerja.
- **Form**: `Input`, `Select`, `Label` shadcn; label selalu di atas field; error di bawah field (`aria-invalid` + pesan yang menjelaskan perbaikan).
- **Overlay**: `Dialog` untuk form, `AlertDialog` untuk konfirmasi hapus. `AlertDialogAction`/`Cancel` di `components/ui/alert-dialog.tsx` masih gaya lama: bungkus `Button` dengan `asChild`.

### 4.5 Chart
Recharts dengan `var(--chart-N)`. Garis datar `strokeWidth` 2, titik berongga, isian di bawah garis datar transparan (`fillOpacity` 0,08), hanya garis bantu horizontal, tooltip `--popover` dengan tepi `--border`. Legenda selalu tertulis.

### 4.6 Keadaan dan teks
- **Memuat**: skeleton `bg-muted motion-safe:animate-pulse` dengan bentuk isi yang akan datang.
- **Kosong**: ikon Lucide kecil + satu kalimat tentang apa yang belum ada.
- **Gagal**: angka "-", pesan jujur di tiap panel ("belum bisa dimuat", dan "ini bukan berarti stok aman"), plus `GlobalErrorBanner` di layout dengan tombol Coba lagi.
- **Format**: helper di `simo/lib/utils.ts` (`formatRupiah`, `formatAngka`, `formatTanggal`, `formatTanggalPendek`, `formatTanggalInput`). Jangan memformat manual.
- **Motion**: `transition-colors` (hover/fokus), `motion-safe:animate-pulse`/`animate-spin`, animasi dropdown/dialog shadcn. Tanpa animasi dekoratif.

### 4.7 Pola v1 (hanya untuk halaman yang belum dimigrasi)
Kartu `rounded-xl border border-line bg-surface p-5 shadow-sm`, stat card dengan ikon dalam lingkaran tint, tabel berkepala kapital, tombol `bg-brand-600`, paginasi dengan `getPageNumbers`. Saat sebuah halaman dimigrasi, pola ini diganti pola 4.2 sampai 4.6. Helper `getPageNumbers` tetap dipakai di semua tabel berpaginasi.

## 5. Penyimpangan yang diketahui (jujur, per 13 Nov 2026)

1. **Isi sebagian besar halaman masih gaya v1** (token `brand/fg/surface/line`, kartu bergaris, uppercase). Hanya Dashboard, `/design`, dan shell yang v2 (6). Hasilnya tampak tidak seragam sampai halaman lain dimigrasi.
2. **Sidebar memuat 9 item datar** tanpa pengelompokan (panduan skill: hierarki navigasi dan batas jumlah item). Pengelompokan belum diusulkan atau dikerjakan.
3. **`components/ui/alert-dialog.tsx`** (Action/Cancel) belum bergaya v2 (memakai token v1); dipakai lewat `asChild Button` pada kode v2. `ConfirmDialog` masih v1.
4. **`GlobalErrorBanner` dan `ErrorPanel`** masih bergaya v1.
5. **Blok `.dark` dihapus** dari `globals.css` (aplikasi hanya mode terang; blok lama tidak pernah aktif). `next-themes` hanya dipakai `sonner`.
6. **Dua blok `:root` di `globals.css`**: blok pertama (`@layer base`, HSL) kode mati, kalah oleh blok kedua (oklch).
7. **Hex di luar token**: PDF `lib/export.ts` (larik RGB) dan grafik Recharts pada halaman v1 masih literal.
8. **`prefers-reduced-motion`**: kode v2 memakai `motion-safe:`; halaman v1 masih sebagian.
9. **Sisa kelas warna lama** (cacahan 10 Nov 2026): 276 kemunculan di 53 berkas, 99 pasangan konflik kaskade; belum dihitung ulang setelah v2.
10. **Halaman nonaktif**: menu Simulasi, Analisis, Perhitungan dinonaktifkan di Sidebar (dikomentari) meski halamannya ada.
11. **Uji tampilan** (`qa-tools/e2e/04-tampilan.spec.js`): teks di dalam `<select>` bawaan browser ditutup mask karena antialiasing-nya berkedip antar-run.
12. **Belum dicocokkan dengan data produksi**: angka pendapatan hari ini (jumlah × `harga_jual`) di Dashboard.

## 6. Progres penataan (v2)

Sumber satu-satunya checklist halaman. "Mengikuti" = isi halaman sudah memakai token dan pola v2. Sidebar, header, latar, dan huruf sudah v2 di semua halaman, jadi "Belum" hanya berarti isinya masih gaya v1. Salinan: `simo/app/design/progres/data.ts`.

| Halaman | Rute / berkas utama | Status | Catatan |
|---|---|---|---|
| Layout (Sidebar + Header) | `components/layout/*` | Mengikuti | Drawer di `< lg`; target sentuh 44px |
| Dashboard | `/dashboard` | Mengikuti | |
| Design (style guide) | `/design` | Mengikuti | Hanya superadmin |
| Data Obat (list, tambah, detail, edit) | `/obat/**` | Belum | Isi gaya v1 |
| Barang Masuk | `/barang-masuk` | Belum | Isi gaya v1 |
| Barang Keluar | `/barang-keluar` | Belum | Isi gaya v1 |
| Monitoring | `/monitoring` | Belum | Isi gaya v1 |
| Perhitungan EOQ/ROP | `/perhitungan` | Belum | Hanya admin; menu nonaktif |
| Laporan | `/laporan` | Belum | Isi gaya v1 |
| Simulasi | `/simulasi` | Belum | Hanya admin; menu nonaktif |
| Analisis Komparatif | `/analisis` | Belum | Hanya admin; menu nonaktif |
| Supplier (list, tambah, edit) | `/supplier/**` | Belum | Isi gaya v1 |
| Manajemen User | `/users` | Belum | Hanya admin |
| Pengaturan | `/pengaturan` | Belum | Hanya admin |
| Reorder | `/reorder` | Belum | Isi gaya v1 |
| Pemantauan | `/pemantauan` | Belum | Hanya superadmin |
| Login | `/login` | Belum | Isi gaya v1 |
| Error / not-found | `app/error.tsx`, `not-found.tsx` | Belum | `ErrorPanel` masih gaya v1 |

Hak akses per peran (admin, staf, superadmin) mengikuti aplikasi; UI tidak menjadi sumber keamanan (keamanan di backend).

## 7. Redesign dan referensi

- **Izin skill desain eksternal**: dilarang tanpa izin eksplisit Boss. Izin 13 Nov 2026 (redesign Dashboard dan `/design`): `ui-ux-pro-max`, `hallmark`, `frontend-design`, dan `impeccable`, dengan arahan Boss untuk tidak terikat panduan v1. Izin berlaku untuk tugas itu; migrasi halaman lain perlu persetujuan baru. Izin lama yang sudah dipakai: kartu Distribusi Kategori (commit dfc6495).
- **Referensi visual v1**: `docs/design-reference/` (17 gambar "Akuris Design System", Okt 2026) dipakai untuk v1; v2 tidak mengikutinya. Folder itu tidak boleh diubah atau dipindah.
- **Cara migrasi sebuah halaman**: ganti kartu v1 dengan Panel dan ubin (4.2), tabel dengan pola 4.3, tombol dan form dengan shadcn (4.4), lalu cek kontras (2.2), lihat tampilan di HP dan desktop, dan perbarui Progres (6).
- **Fase D (komponen bersama)**: Panel, StatTile, dan ReorderTile sudah menjadi komponen di `simo/components/dashboard/`; belum ada komponen bersama di luar dashboard.

## 8. Riwayat dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-11-10 | Pertama (T-D1): menggantikan `FE-AGENT.md` penuh dan `07-ui-guidelines.md` (dihapus). Berdasarkan token T-D2 dan migrasi Tahap B. |
| 2.0 | 2026-11-13 | Redesign v2 (Flat + Bento): token shadcn sebagai token halaman v2, huruf Figtree, shell baru (sidebar dan header menyatu dengan kanvas, target sentuh 44px), pola ubin dan panel, status Habis, keadaan gagal, kontras hasil ukur, tabel progres v2. Pola v1 dipindah ke 4.7 dan 5. |
