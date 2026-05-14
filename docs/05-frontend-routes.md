# Frontend Routes & Komponen — Next.js

## Route Map

| URL | File | Halaman | Role |
|---|---|---|---|
| `/` | `app/page.tsx` | Redirect ke `/login` atau `/dashboard` | — |
| `/login` | `app/(auth)/login/page.tsx` | Login | Public |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Dashboard | Semua |
| `/obat` | `app/(dashboard)/obat/page.tsx` | Data Master Obat | Semua |
| `/obat/tambah` | `app/(dashboard)/obat/tambah/page.tsx` | Form Tambah Obat | Admin |
| `/obat/[id]/edit` | `app/(dashboard)/obat/[id]/edit/page.tsx` | Form Edit Obat | Admin |
| `/obat/[id]/detail` | `app/(dashboard)/obat/[id]/detail/page.tsx` | Detail Perhitungan | Semua |
| `/barang-masuk` | `app/(dashboard)/barang-masuk/page.tsx` | Barang Masuk | Semua |
| `/barang-keluar` | `app/(dashboard)/barang-keluar/page.tsx` | Barang Keluar | Semua |
| `/perhitungan` | `app/(dashboard)/perhitungan/page.tsx` | Perhitungan EOQ & ROP | Semua |
| `/simulasi` | `app/(dashboard)/simulasi/page.tsx` | Simulasi Skenario | Admin |
| `/monitoring` | `app/(dashboard)/monitoring/page.tsx` | Monitoring Stok | Semua |
| `/analisis` | `app/(dashboard)/analisis/page.tsx` | Analisis Komparatif | Admin |
| `/laporan/stok-harian` | `app/(dashboard)/laporan/stok-harian/page.tsx` | Laporan Stok | Semua |
| `/laporan/barang-masuk` | `app/(dashboard)/laporan/barang-masuk/page.tsx` | Laporan Barang Masuk | Semua |
| `/laporan/barang-keluar` | `app/(dashboard)/laporan/barang-keluar/page.tsx` | Laporan Barang Keluar | Semua |
| `/laporan/kedaluarsa` | `app/(dashboard)/laporan/kedaluarsa/page.tsx` | Laporan Kedaluarsa | Semua |
| `/laporan/eoq-rop` | `app/(dashboard)/laporan/eoq-rop/page.tsx` | Laporan EOQ/ROP | Semua |
| `/laporan/simulasi` | `app/(dashboard)/laporan/simulasi/page.tsx` | Laporan Simulasi | Admin |
| `/supplier` | `app/(dashboard)/supplier/page.tsx` | Manajemen Supplier | Semua |
| `/users` | `app/(dashboard)/users/page.tsx` | Manajemen User | Admin |
| `/pengaturan` | `app/(dashboard)/pengaturan/page.tsx` | Pengaturan Sistem | Admin |

---

## Layout System

### Root Layout (`app/layout.tsx`)
- Wrap dengan `AuthProvider` (React context)
- Wrap dengan `QueryClientProvider` (React Query)
- Import global font (Inter/Poppins via next/font)
- Import globals.css

### Auth Layout (`app/(auth)/layout.tsx`)
- Halaman tanpa sidebar
- Cek: jika sudah login → redirect ke `/dashboard`
- Layout: centered, full height

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
- Cek: jika belum login → redirect ke `/login`
- Inject komponen `Sidebar` di kiri
- Inject komponen `Header` di atas
- Render `{children}` di area konten utama
- Responsive: sidebar collapse di mobile (hamburger menu)

```tsx
// Struktur visual dashboard layout
┌─────────────────────────────────────────────────┐
│  HEADER (nama apotek, user, logout, notif bell) │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│   SIDEBAR    │   {children} — konten halaman    │
│   (nav menu) │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

---

## Komponen Kunci

### `Sidebar.tsx`
- Render menu berbeda berdasarkan `user.role`
- Menu staf: Dashboard, Data Obat, Barang Masuk, Barang Keluar, Monitoring, Laporan, Supplier
- Menu admin: semua menu staf + Simulasi, Analisis, Manajemen User, Pengaturan
- Highlight menu aktif sesuai route saat ini
- Grup menu: "Utama", "Transaksi", "Analitik", "Laporan", "Pengaturan"

### `StatusBadge.tsx`
```tsx
// Props: status: 'AMAN' | 'MENDEKATI_ROP' | 'HARUS_REORDER'
// AMAN        → bg-green-100 text-green-800
// MENDEKATI   → bg-yellow-100 text-yellow-800
// HARUS_REORDER → bg-red-100 text-red-800
```

### `RumusDisplay.tsx`
Komponen untuk menampilkan langkah perhitungan step-by-step (format mirip buku matematika):
```tsx
// Render output seperti:
// EOQ = √(2 × D × S / H)
//     = √(2 × 1200 × 50000 / 250)
//     = √(480.000)
//     = 692,82 ≈ 693 unit
```
Menggunakan monospace font dan indentasi konsisten.

### `DataTable.tsx`
Tabel generik dengan:
- Pagination (client-side atau server-side)
- Search/filter
- Sort per kolom
- Loading state (skeleton)
- Empty state

### `ExportButton.tsx`
- Mode: `pdf` atau `excel`
- Trigger generate di browser menggunakan jsPDF / xlsx
- Loading state saat generate

### `AlertNotification.tsx`
- Muncul sebagai toast di pojok kanan bawah
- Merah untuk alert reorder
- Auto-dismiss setelah 8 detik
- Bisa di-dismiss manual

---

## State Management

### Zustand Store: `auth.store.ts`
```ts
interface AuthStore {
  user: User | null
  token: string | null
  setUser: (user: User, token: string) => void
  logout: () => void
  isAdmin: () => boolean
}
```

### React Query
Semua data dari API difetch menggunakan React Query:
- Cache key konvensi: `['obat']`, `['obat', id]`, `['barang-masuk']`, dll
- Stale time: 30 detik untuk data yang sering berubah, 5 menit untuk master data
- Setiap mutasi (POST/PUT/DELETE) memicu `invalidateQueries` untuk key terkait
- `reorder_alert` dari response POST barang-keluar ditangkap di `onSuccess` callback

---

## Data Flow per Halaman

### Dashboard
```
useDashboard hook
  → GET /api/dashboard/summary        → StatCard × 5 + ReorderTable
  → GET /api/dashboard/tren-permintaan → TrenPermintaanChart
  → GET /api/dashboard/perbandingan-biaya → PerbandinganBiayaChart
```

### Data Master Obat
```
useObat hook
  → GET /api/obat?search&kategori&status&page
  → tabel dengan ObatTable komponen
  → Badge status otomatis dari data stok vs rop
  → Tombol Tambah → navigate ke /obat/tambah
  → Tombol Edit → navigate ke /obat/{id}/edit
  → Tombol Detail → navigate ke /obat/{id}/detail
  → Tombol Hapus → ConfirmDialog → DELETE /api/obat/{id}
```

### Barang Keluar (paling kompleks)
```
Page load:
  → GET /api/obat (dropdown pilih obat)

Submit form:
  → POST /api/barang-keluar
  → onSuccess:
      if (response.reorder_alert === true):
        → tampilkan AlertNotification merah
        → update Zustand notification store
      → invalidate React Query: ['barang-keluar'], ['obat'], ['dashboard']
      → reset form
```

### Simulasi Skenario
```
Page load:
  → GET /api/obat (dropdown pilih obat)

Pilih obat:
  → GET /api/obat/{id} → tampilkan nilai aktual di panel kiri

Submit simulasi:
  → POST /api/simulasi/jalankan (tidak simpan)
  → tampilkan tabel perbandingan + SimulasiChart

Klik "Simpan Skenario":
  → POST /api/simulasi/simpan
  → invalidate ['simulasi']
```

---

## Tipe TypeScript Utama (`types/obat.ts`)

```ts
export interface Obat {
  id: number
  kode: string
  nama: string
  kategori: string
  satuan: string
  satuan_per_dus: number
  harga_beli: number
  stok: number
  biaya_pesan: number
  biaya_simpan: number
  lead_time: number
  service_level: number
  expired_terdekat: string | null
  supplier_id: number | null
  nama_supplier: string | null

  // Hasil kalkulasi
  eoq: number | null
  safety_stock: number | null
  rop: number | null
  total_biaya: number | null
  demand_harian: number | null
  std_dev_demand: number | null
  demand_tahunan: number | null

  // Computed (tidak dari API, dihitung di frontend)
  status: 'AMAN' | 'MENDEKATI_ROP' | 'HARUS_REORDER'
  estimasi_habis_hari: number | null  // stok / demand_harian
}

export interface BarangMasuk {
  id: number
  tanggal: string
  obat_id: number
  nama_obat: string
  jumlah_dus: number
  jumlah_satuan: number
  supplier_id: number | null
  nama_supplier: string | null
  no_faktur: string | null
  expired_batch: string | null
  catatan: string | null
  stok_sebelum: number
  stok_sesudah: number
  created_at: string
}

export interface HasilSimulasi {
  nilai_sekarang: NilaiEoq
  nilai_simulasi: NilaiEoq
  selisih: SelisihEoq
}

interface NilaiEoq {
  demand_tahunan: number
  eoq: number
  safety_stock: number
  rop: number
  total_biaya: number
}
```

---

## Komponen Grafik

### `TrenPermintaanChart.tsx`
- Library: Recharts `LineChart`
- X-axis: bulan (6 bulan terakhir)
- Y-axis: jumlah unit keluar
- Multi-line: satu garis per kategori obat
- Tooltip detail saat hover
- Legend di bawah

### `PerbandinganBiayaChart.tsx`
- Library: Recharts `BarChart`
- X-axis: nama obat (top 10 terbesar biayanya)
- Y-axis: total biaya (Rp)
- Grouped bar: sebelum EOQ vs sesudah EOQ
- Format Y-axis: `Rp X.XXX.XXX`

### `SimulasiChart.tsx`
- Library: Recharts `BarChart`
- X-axis: parameter (EOQ, SS, ROP, TC)
- Y-axis: nilai
- Grouped bar: kondisi sekarang vs skenario simulasi
- Warna: biru (sekarang) vs oranye (simulasi)

---

## Proteksi Route (Middleware)

```ts
// middleware.ts di root simo/
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

// Role guard → dilakukan di dalam page component:
// jika user.role !== 'admin' → tampilkan halaman 403 atau redirect
```
