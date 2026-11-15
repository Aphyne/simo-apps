# DESIGN — Sumber Tunggal Design System SIMO

Versi 2.1 · 16 Nov 2026 · Gaya: Flat + Bento · Spesifikasi lama (v1): `docs/spec/design-system.md` · Penunjuk untuk agent: `docs/FE-AGENT.md`

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
6. Komponen dasar dari shadcn (`simo/components/ui/`): Button, Card, Table, Badge, Input, Select, Dialog, DropdownMenu, Progress, Field, Tooltip, Skeleton. Pola halaman bersama ada di `simo/components/shared/` (4.8). Pakai ulang sebelum membuat baru. Catatan pemasangan: CLI shadcn menulis `import { cn } from "cn"` (paket npm lain, bukan milik proyek); ganti ke `@/lib/utils` dan jangan pasang paket `cn`.
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
- **Ringkasan halaman daftar** (`KategoriDonut`, `StatusStokBar`): satu baris bento sekitar 230 sampai 260px, tiga kolom `lg:col-span-4`. (1) **Donut kategori**: SEMUA kategori menjadi irisan (token `kategori-1..14`), tetapi legenda hanya menuliskan lima teratas (nama dan jumlah; persen hanya di tengah donat, supaya nama tidak terpotong di lebar sempit) sehingga panel ringkas; sisanya terbaca lewat sorotan irisan atau Select filter ("Flu & Batuk (21)"). Donat adalah **satu tab stop** (roving tabindex): panah, Home, dan End berpindah antar irisan, Enter atau Spasi memfilter tabel (`aria-pressed`, klik lagi untuk batal). Irisan yang difokus keyboard diberi cincin tipis `stroke-foreground` di luar cincin donat; saat disorot (hover, fokus, terpilih) nama, jumlah, dan persen tampil di tengah donat (tanpa `aria-live`, karena `aria-label` irisan sudah membacakannya) dan irisan lain dipudarkan. Dua warna terang (`kategori-5`, `kategori-13`) sudah diperdalam agar lebih terlihat di atas putih; kontras bukan-teks belum diukur. Ini pengecualian yang disetujui Boss atas aturan "maksimal 5 sampai 6 irisan" dari skill; irisan kecil (1 obat, sekitar 1%) tipis dan lebih mudah dipilih lewat Select. Daftar batang 14 baris dan baris chip dicoba dan dibuang. (2) **Batang status stok**: komposisi tiga bagian sebagai batang bertumpuk 100% (Aman `primary`, Mendekati ROP `warning-500`, Harus reorder `danger-500`) dengan kalimat inti di atasnya ("64 dari 82 obat aman, 78%") dan legenda tertulis yang juga tombol filter status. (3) Kolom kanan: ubin biru `ReorderTile compact` (keterangannya memuat informasi baru, mis. "dari 82 obat, 3 stok sudah habis", lewat prop `keterangan`) dan satu `StatTile compact` (keterangan "akan expired" menyebut jumlah yang sudah lewat tanggal, terpisah dari hitungan 90 hari). Garis level stok (`LevelBar`) **tidak dipakai di tabel Data Obat** (Boss tidak memahaminya, 16 Nov 2026); angka stok dan ROP sudah tertulis, dan statusnya ada di badge. `LevelBar` tetap dipakai di panel Stok menipis Dashboard. Hati-hati nama: ada kategori sungguhan bernama "Lainnya"; irisan gabungan sengaja diberi nama "N kategori lain".
- **Ubin ringkasan ringkas** (`StatTile compact`, `ReorderTile compact`): untuk halaman daftar, supaya tabel sudah terlihat di layar pertama. Baris label `min-h-9`, lalu angka `text-3xl` dan keterangan sejajar; sekitar 106px tinggi. Empat ubin satu baris di `lg`; ubin biru memuat tombol 36px di kanan label. Dashboard tetap memakai ubin penuh (4.2).
- **Kisi fakta** (`FactList`, `Fact`): untuk halaman detail. Label `text-sm` abu di atas, nilai `text-base font-medium` di bawah, tanpa kotak per fakta. **Nilai yang belum terisi tidak boleh tampil sebagai angka nol yang tampak sah**: harga, biaya, dan lead time bernilai 0 atau kosong ditulis "Belum diisi" (abu, `font-normal`), tanggal yang tidak ada ditulis "Belum ada".
- **Angka utama di detail**: tiga `StatTile compact` sebaris (stok, titik pesan ulang ROP, estimasi habis) sekitar 106px tinggi, sehingga stok dan ROP berdampingan; lalu `Panel` rincian satu baris penuh (`lg:grid-cols-6`). Stok 0 menampilkan "Habis" (prop `teks`), bukan "0 hari", dan keterangan ubin dikosongkan (tidak mengulang). Di HP ubin stok dan ROP berdampingan (`col-span-6`). Di bawah kepala ada **satu kalimat tindakan** (`description` PageHeader) yang **hanya memuat tindakan dan tidak mengulang angka** yang sudah ada di ubin ("Stok sudah di bawah titik pesan ulang, saatnya memesan. Disarankan pesan sekitar 120 botol."). Obat yang aman tidak diberi kalimat (badge "Aman" sudah cukup). Stok habis diperiksa lebih dulu daripada ROP; bila ROP belum bisa dihitung, kalimat itu jujur menyebutnya. **Satu tombol biru per halaman**: bila obat perlu dipesan (stok 0 atau Harus reorder) tombol biru adalah "Buka Reorder" (`/reorder`, khusus admin) dan "Ubah data" menjadi outline; bila tidak, "Ubah data" yang biru. Prinsipnya: setiap fakta ditulis satu kali di satu tempat (badge, ubin, atau kalimat), tidak dua atau tiga kali. Kolom `numeric` dari Postgres tiba sebagai **teks** ("1.95"); ubah dengan `Number()` sebelum dikirim ke `StatTile` (yang memakai `toLocaleString`), atau pakai `formatAngka`. Satu ubin biru (`ReorderTile`) hanya di halaman daftar. `StatusBadge` menerima `stok`: stok 0 tampil "Habis" (tingkat tertinggi, 4.3).
- **Hasil perhitungan** (`RumusDisplay`, prop `satuan` = satuan obat): hasil di atas, empat kolom angka `text-3xl` dipisah garis tipis, tanpa kartu di dalam panel dan tanpa warna per rumus. Judul awam dengan istilah teknis di kurung ("Jumlah sekali pesan (EOQ)", "Titik pesan ulang (ROP)"). Hasil kosong ditulis "Belum bisa dihitung" per kolom, dan **satu blok penyebab di atas kolom** (tidak diulang per kolom): "Butuh riwayat penjualan, biaya sekali pesan (terisi dari Barang masuk)". Hanya **tiga kolom** (jumlah sekali pesan, stok pengaman, total biaya) karena titik pesan ulang (ROP) sudah ada di ubin atas; ROP dijelaskan lewat satu tautan teks "Cara menghitung titik pesan ulang (ROP)". **Kebijakan pembulatan**: perhitungan tidak membulatkan langkah tengah dan backend menyimpan hasil dengan 2 desimal; semua hasil perhitungan (EOQ, stok pengaman, ROP, total biaya) ditampilkan 2 desimal persis seperti tabel skripsi, termasuk ROP di ubin (jangan dibulatkan: stok dibandingkan dengan ROP persis, jadi ROP 1,95 yang ditulis "2" menyiratkan aturan yang salah). Satu-satunya pembulatan adalah saran jumlah pesanan di kalimat tindakan, dibulatkan **ke atas** (`Math.ceil`) karena barang tidak bisa dipesan pecahan dan ditulis "sekitar". Estimasi hari habis dibulatkan ke bawah (konservatif, `utils/estimasi.js`). Parameter yang belum terisi tertulis "Belum diisi". Satu tombol teks per kolom (40px), "Cara menghitung", sejajar di dasar kolom, membuka `Dialog` berisi definisi, data yang dipakai, rumus (`font-mono` di atas `bg-muted`), substitusi, kalkulasi, dan hasil. Seluruh parameter (D, d, σ, S, H, LT, Z, dengan nama awam) dilipat dalam `<details>` "Lihat data yang dipakai menghitung". Tombol "Hitung ulang" ada di panel ini (slot `action`), bukan di kepala halaman. Untuk non-admin, panel diganti satu baris keterangan bergembok, bukan panel kosong. Asal data: harga dan biaya pesan terisi dari Barang masuk, lama pengiriman dari Supplier; Rincian menuliskannya bila ada yang kosong.
- **Halaman ubah (edit)**: kepala memuat meta yang sama dengan detail (kode, kategori, badge status) dan satu kalimat yang menjelaskan apa yang tidak bisa diubah di sini (harga, biaya pesan, dan supplier terisi dari Barang masuk; stok berubah lewat transaksi). Form satu bagian dengan grid dua kolom mulai `md` (lihat aturan form). Peringatan satuan (blok `warning-50` selebar form) **hanya muncul bila satuan atau isi per dus benar-benar diubah** dari nilai awal, bukan kalimat statis yang selalu tampil. Tanda wajib (`*`) berwarna merah dengan keterangan "Semua kolom wajib diisi" di atas form. Badge status tidak ditampilkan di kepala halaman ubah. Gagal memuat dibedakan dari "tidak ditemukan" dan punya aksi "Coba lagi". Kembali, Batal, dan Simpan kembali ke **halaman asal**, bukan selalu ke detail: ikon pensil di daftar membawa alamat daftar lengkap dengan filternya (`?dari=`), tombol "Ubah data" di detail membawa alamat detail (hook `useAsalHalaman`; hanya alamat di dalam `/obat` yang dipercaya, selebihnya jatuh ke cadangan, dan memakai `router.replace`). `onBatal` pada `ObatForm` wajib (tidak ada tujuan bawaan). Kembali di kepala halaman juga meminta konfirmasi bila form sudah diubah (`onDirtyChange` + `KonfirmasiBuang`). Mengubah satuan meminta **konfirmasi** (`AlertDialog`, "Periksa lagi" / "Ya, simpan") setelah validasi lolos, karena angka stok dan batch lama tidak dikonversi. Select kategori dan satuan memicu validasi ulang (`shouldValidate`) sehingga galat hilang begitu nilai dipilih. **Aturan form (tambah dan ubah)**: (1) `noValidate`: semua galat ditulis inline oleh form, bukan balon bawaan peramban; angka diperiksa bulat 1 sampai 100.000 (sama dengan backend). (2) Saat Simpan gagal validasi, fokus dan gulir ke field pertama yang salah urut layar, **termasuk Select** (yang memakai input hidden, jadi fokusnya diatur manual lewat `id` trigger, `shouldFocusError: false`). (3) Bila server menolak, pesan server tampil tetap di atas tombol (`errors.root.server`) selain toast yang hilang sendiri; `onSubmit` boleh async. (4) Batal dengan isian yang sudah diubah meminta konfirmasi "Buang isian ini?". (5) **Grid dua kolom** mulai `md` (di bawahnya satu kolom): nama selebar penuh, lalu kategori dan satuan berdampingan, lalu baris isi per dus selebar penuh. Hint satu baris pendek; kolom sempit (sekitar 200px) dengan hint 2 sampai 3 baris terbukti berantakan dan tinggi antar kolom tidak sama. **Field yang berpasangan ditulis sebagai satu kalimat** ("1 dus berisi [100] tablet": teks abu, input 112px, lalu satuan terpilih tebal) sehingga hubungannya jelas tanpa paragraf penjelasan; pola ini dipakai untuk pasangan angka dan satuan di form lain. (6) Nilai tersimpan yang tidak ada di daftar baku (kategori atau satuan lama) tetap menjadi pilihan, bukan trigger kosong. (7) Isi per dus tetap wajib dengan nilai awal 1 dan catatan satu baris "Isi 1 bila obat ini tidak dibeli per dus"; satuan "dus" dan "strip" tetap ada di daftar (dipakai di data apotek). (9) **Nama obat kembar ditolak backend** (409, `field: 'nama'`; dibandingkan tanpa membedakan huruf besar/kecil dan spasi ganda, hanya saat nama berubah) dan galatnya tampil di bawah field Nama, bukan hanya toast. (10) Halaman tambah punya **"Simpan dan tambah lagi"** (outline, di kiri tombol biru): menyimpan, mengosongkan Nama dan Isi per dus tetapi **mempertahankan kategori dan satuan** (memasukkan banyak obat sekategori), memfokuskan Nama, dan menulis konfirmasi "X sudah ditambahkan. Kategori dan satuan tetap dari obat sebelumnya, ubah bila perlu." di wadah `role="status"` yang selalu ada. (8) Halaman tambah: Batal dan Kembali ke halaman asal (daftar beserta filternya, cadangan `/obat`); setelah **Tambah obat**, pengguna dibawa ke daftar yang **difilter ke nama obat baru** (`/obat?q=<nama>`) supaya barisnya langsung terlihat; "Atur ulang" mengembalikan daftar penuh. Dialog Tambah Obat di Dashboard: Batal menutup dialog.
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
| Data Obat (list, tambah, detail, edit) | `/obat/**` | Mengikuti | Dikerjakan 16 Nov 2026; menunggu acc Boss. Pola baru di 4.8 |
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

- **Izin skill desain eksternal**: dilarang tanpa izin eksplisit Boss. Izin 13 Nov 2026 (redesign Dashboard dan `/design`): `ui-ux-pro-max`, `hallmark`, `frontend-design`, dan `impeccable`, dengan arahan Boss untuk tidak terikat panduan v1. Izin berlaku untuk tugas itu; migrasi halaman lain perlu persetujuan baru. Izin 16 Nov 2026 (migrasi Data Obat): `ui-ux-pro-max`, `frontend-design`, `impeccable`, dan sloplint dari `hallmark`; Boss juga mengizinkan komponen shadcn baru bila skill menyarankan (terpasang: Field, Tooltip, Skeleton). Izin lama yang sudah dipakai: kartu Distribusi Kategori (commit dfc6495; donut 14 kategorinya diganti pada 16 Nov 2026 dengan donut semua kategori (legenda lima teratas, irisan bisa diklik) dan batang status stok, atas permintaan Boss).
- **Referensi visual v1**: `docs/design-reference/` (17 gambar "Akuris Design System", Okt 2026) dipakai untuk v1; v2 tidak mengikutinya. Folder itu tidak boleh diubah atau dipindah.
- **Cara migrasi sebuah halaman**: ganti kartu v1 dengan Panel dan ubin (4.2), tabel dengan pola 4.3, tombol dan form dengan shadcn (4.4), lalu cek kontras (2.2), lihat tampilan di HP dan desktop, dan perbarui Progres (6).
- **Fase D (komponen bersama)**: Panel, StatTile, dan ReorderTile ada di `simo/components/dashboard/`; pola halaman (PageHeader, FilterBar, Pagination, FormParts, FactList, StateMessage, IconAction) ada di `simo/components/shared/` sejak 16 Nov 2026 (4.8).

## 8. Riwayat dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-11-10 | Pertama (T-D1): menggantikan `FE-AGENT.md` penuh dan `07-ui-guidelines.md` (dihapus). Berdasarkan token T-D2 dan migrasi Tahap B. |
| 2.1 | 2026-11-16 | Migrasi halaman Data Obat (daftar, tambah, detail, ubah): pola halaman baru (4.8: kepala halaman, bilah filter, paginasi, tombol ikon bertooltip, ubin ringkasan ringkas, kisi fakta, keadaan, bagian form), komponen shadcn Field/Tooltip/Skeleton, `alert-dialog`/`ConfirmDialog`/`StatusBadge`/`RumusDisplay` ke v2, donut 14 kategori dikembalikan dengan legenda lima teratas dan irisan yang memfilter, status stok jadi batang bertumpuk; token `kategori-1..14`. |
| 2.0 | 2026-11-13 | Redesign v2 (Flat + Bento): token shadcn sebagai token halaman v2, huruf Figtree, shell baru (sidebar dan header menyatu dengan kanvas, target sentuh 44px), pola ubin dan panel, status Habis, keadaan gagal, kontras hasil ukur, tabel progres v2. Pola v1 dipindah ke 4.7 dan 5. |
