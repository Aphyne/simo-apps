# FE-AGENT — SIMO Design System Guardian

Kamu adalah frontend design agent untuk proyek **SIMO** (Sistem Informasi Manajemen Obat) Apotek Rezky Medika.
File ini adalah design bible — baca seluruhnya sebelum mengadjust halaman apapun.

> **Backend sudah fix. Jangan ubah logic, hooks, data fetching, atau API calls — hanya ubah tampilan (JSX + Tailwind classes).**

## Cara Menggunakan

```
@docs/FE-AGENT.md Adjust halaman [nama halaman] sesuai design system
```

---

## 1. Design Principles

- **Clean & Minimal** — tidak ada elemen dekoratif berlebihan, setiap elemen punya tujuan
- **White-dominant** — cards dan panels selalu putih, page background abu sangat muda
- **Colored accents only** — warna dipakai hanya pada icon, badge, status — bukan background besar
- **Consistent hierarchy** — info terpenting = teks besar + bold, info sekunder = kecil + abu
- **Good UX** — label jelas, status mudah dibaca, tombol aksi mudah ditemukan

---

## 2. Color Palette

| Peran | Tailwind Class | Hex | Dipakai untuk |
|---|---|---|---|
| Primary | `blue-600` | #2563EB | Active nav, primary button, accent utama |
| Primary Light | `blue-100` | #DBEAFE | Icon bg biru, hover ringan |
| Danger | `red-500` / `red-600` | #EF4444 | Stok kritis, error, alert |
| Danger Light | `red-100` | #FEE2E2 | Icon bg merah, badge kritis |
| Success | `emerald-500` / `emerald-600` | #10B981 | Stok aman, sukses |
| Success Light | `emerald-100` | #D1FAE5 | Icon bg hijau, badge aman |
| Warning | `orange-500` | #F97316 | Mendekati expired, peringatan |
| Warning Light | `orange-100` | #FFEDD5 | Icon bg oranye, badge warning |
| Accent | `purple-500` / `purple-600` | #8B5CF6 | Statistik netral, transaksi |
| Accent Light | `purple-100` | #EDE9FE | Icon bg ungu |
| Page BG | `gray-50` | #F9FAFB | Background halaman (main area) |
| Card BG | `white` | #FFFFFF | Background semua card/panel |
| Border | `gray-200` | #E5E7EB | Border card, tabel, divider |
| Text Primary | `gray-900` | #111827 | Judul, nilai angka utama |
| Text Secondary | `gray-600` | #4B5563 | Label, teks konten |
| Text Muted | `gray-400` / `gray-500` | #9CA3AF | Sublabel, placeholder, footer |

---

## 3. Layout Rules

### Sidebar
```
bg-white border-r border-gray-200 w-64 min-h-screen
```
- Brand title: `text-xl font-bold text-gray-900 tracking-tight`
- Brand subtitle (nama apotek): `text-xs text-gray-400 mt-0.5`
- Nav item **normal**: `text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg px-3 py-2.5`
- Nav item **active**: `bg-blue-600 text-white rounded-lg px-3 py-2.5`
- Nav icon: `w-4 h-4 flex-shrink-0`
- Footer: `text-xs text-gray-400 border-t border-gray-200 px-6 py-3`

### Header
```
bg-white border-b border-gray-200 h-14 px-6
```
- Kiri: Page title atau breadcrumb (opsional)
- Kanan: AlertNotification → nama user → role badge → tombol logout
- Role badge admin: `bg-blue-600 text-white text-xs`
- Role badge staf: `bg-gray-100 text-gray-700 text-xs`

### Main Content Area
```
bg-gray-50 p-6 flex-1 overflow-auto
```

### Page Header (dalam konten halaman)
```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-gray-900">Judul Halaman</h1>
  <p className="text-sm text-gray-500 mt-0.5">Deskripsi singkat</p>
</div>
```

---

## 4. Component Specs

### Stat Card
Willow style: white bg, colored icon circle, dark value text. Semua card konsisten, tidak ada yang ber-background warna.

```tsx
// Container
"rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4"

// Icon circle (ganti warna sesuai konteks)
"w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
// Blue:   bg-blue-100   + text-blue-600
// Red:    bg-red-100    + text-red-500
// Green:  bg-emerald-100 + text-emerald-600
// Orange: bg-orange-100  + text-orange-500
// Purple: bg-purple-100  + text-purple-600

// Label
"text-xs text-gray-500 font-medium truncate"

// Value
"text-2xl font-bold leading-tight text-gray-900"

// Sublabel
"text-xs text-gray-400 mt-0.5"
```

### Card / Panel Container
```tsx
"rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
```
- Section title dalam card: `text-sm font-semibold text-gray-700 mb-4`

### Data Table
```tsx
// Table wrapper
"w-full text-sm"

// Header row
"border-b border-gray-200"

// Header cell
"text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-2 text-left"

// Body row
"border-b border-gray-100 hover:bg-gray-50 transition-colors"

// Body cell
"py-3 px-2 text-sm text-gray-700"

// Primary text dalam row (nama obat, dll)
"font-medium text-gray-900"

// Secondary text dalam row (kode, tanggal, dsb)
"text-xs text-gray-400 font-mono"
```

### Status Badge (pill)
```tsx
// Aman / OK
"bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-0.5 rounded-full"

// Reorder / Perlu pesan
"bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-0.5 rounded-full"

// Kritis / Habis
"bg-red-100 text-red-600 text-xs font-medium px-2.5 py-0.5 rounded-full"

// Expired / Kadaluarsa
"bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full"

// Admin
"bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full"

// Staf
"bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full"
```

### Buttons
```tsx
// Primary
"bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm"

// Secondary / Outline
"border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm"

// Danger
"bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm"

// Ghost / Icon button
"text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2"
```

### Form Input
```tsx
// Input field
"border border-gray-300 rounded-lg px-3 py-2 text-sm w-full
 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

// Label
"text-sm font-medium text-gray-700 mb-1 block"

// Error text
"text-xs text-red-500 mt-1"

// Hint text
"text-xs text-gray-400 mt-1"
```

### Chart Container
```tsx
"rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
```
- Title: `text-sm font-semibold text-gray-700 mb-4`
- Chart warna: primary `#2563EB`, secondary `#10B981`, tertiary `#8B5CF6`
- Grid stroke: `#f0f0f0`
- Axis tick: `{ fontSize: 11, fill: '#9CA3AF' }`
- Tooltip: `{ borderRadius: 8, fontSize: 12 }`

### Loading Skeleton
```tsx
"animate-pulse bg-gray-100 rounded-xl"
```

### Empty State
```tsx
"text-center py-10 text-gray-400 text-sm"
```

---

## 5. SIMO Domain — Pemetaan Per Halaman

### Dashboard
- **5 Stat Cards**: Total Obat (blue), Perlu Reorder (red), Penjualan Hari Ini (green), Transaksi Hari Ini (purple), Akan Expired (orange)
- **Row 2**: Tren Permintaan chart (col-span-2) + Obat Mendesak table (col-span-1)
- **Row 3**: Perbandingan Biaya chart (full width)

### Data Obat (`/obat`)
- Tabel: Kode, Nama, Kategori, Stok + satuan, ROP, EOQ, Expired, Status badge
- Status badge: Aman (emerald) / Reorder (orange) / Kritis (red) / Expired (gray)
- CTA kanan atas: "Tambah Obat" (primary button)
- Row actions: Detail (ghost), Edit (ghost), Hapus (danger ghost — admin only)

### Barang Masuk / Barang Keluar (`/barang-masuk`, `/barang-keluar`)
- Form di bagian atas → riwayat tabel di bawah
- Badge jenis: Masuk (blue) / Keluar (orange)

### Perhitungan EOQ/ROP (`/perhitungan`)
- Card per obat menampilkan hasil EOQ & ROP
- RumusDisplay: styled code-block atau formula card

### Monitoring (`/monitoring`)
- Tabel semua obat + status stok real-time
- Color-coded berdasarkan urgency (row atau badge)

### Laporan (`/laporan`)
- Filter periode + tombol export (PDF/Excel) di kanan atas
- Summary cards di atas, tabel detail di bawah

### Simulasi (`/simulasi`) — admin only
- Input parameter di panel kiri/atas
- Chart perbandingan skenario di kanan/bawah

### Analisis Komparatif (`/analisis`) — admin only
- Chart + tabel perbandingan biaya EOQ vs Tradisional

### Supplier (`/supplier`)
- Tabel: Kode, Nama, Kontak, Alamat, Actions
- CTA: "Tambah Supplier" (primary button)

### Manajemen User (`/users`) — admin only
- Tabel: Username, Nama, Role badge, Actions
- CTA: "Tambah User"

### Pengaturan (`/pengaturan`) — admin only
- Form settings apotek dalam card
- Save button di bawah

### Login (`/login`)
- Layout: centered card di tengah layar
- Card: `max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-md`
- Logo SIMO di atas form
- Input email + password + tombol login

---

## 6. Implementation Checklist

Update checklist ini setiap kali sebuah halaman sudah di-acc user.

- [x] Layout (Sidebar + Header)
- [x] Dashboard
- [ ] Data Obat (list, tambah, detail, edit)
- [ ] Barang Masuk
- [ ] Barang Keluar
- [ ] Monitoring
- [ ] Perhitungan EOQ/ROP
- [ ] Laporan
- [ ] Simulasi
- [ ] Analisis Komparatif
- [ ] Supplier (list, tambah, edit)
- [ ] Manajemen User
- [ ] Pengaturan
- [ ] Login

---

## 7. Aturan Wajib untuk Agent

1. Baca FE-AGENT.md ini **sepenuhnya** sebelum mulai
2. Baca file halaman yang ditarget (page.tsx + komponen terkait)
3. **Jangan ubah** logic, hooks, fetch, API calls, validasi, atau types
4. Gunakan Tailwind classes persis seperti yang didefinisikan di bagian 3 & 4
5. Jaga konsistensi dengan halaman yang sudah selesai
6. Setelah user acc, centang checklist di bagian 6
7. Implementasi bertahap: 1 halaman selesai + di-acc user → baru lanjut halaman berikutnya

---

*Design references: Willow (card style, consistency), Medicare (color palette, layout), Pharmo (pharmacy context, table)*
*Project: SIMO — Apotek Rezky Medika | Stack: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui*
*Last updated: 2026-05-22*
