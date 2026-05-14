# UI/UX Guidelines — SIMO

---

## 1. Palet Warna

### Warna Utama (Primary)

| Nama | Hex | Tailwind | Penggunaan |
|---|---|---|---|
| Primary | `#2563EB` | `blue-600` | Tombol utama, header, link aktif |
| Primary Dark | `#1D4ED8` | `blue-700` | Hover state tombol |
| Primary Light | `#DBEAFE` | `blue-100` | Background highlight |
| White | `#FFFFFF` | `white` | Background kartu, form |
| Gray Light | `#F9FAFB` | `gray-50` | Background halaman |

### Warna Status Stok

| Status | Latar | Teks | Tailwind Class | Hex |
|---|---|---|---|---|
| AMAN | `#DCFCE7` | `#166534` | `bg-green-100 text-green-800` | Hijau |
| MENDEKATI ROP | `#FEF9C3` | `#854D0E` | `bg-yellow-100 text-yellow-800` | Kuning |
| HARUS REORDER | `#FEE2E2` | `#991B1B` | `bg-red-100 text-red-800` | Merah |

### Warna Grafik

| Dataset | Hex | Tailwind |
|---|---|---|
| Aktual / Sekarang | `#3B82F6` | `blue-500` |
| Simulasi | `#F97316` | `orange-500` |
| Sebelum EOQ | `#EF4444` | `red-500` |
| Sesudah EOQ | `#22C55E` | `green-500` |

---

## 2. Tipografi

- **Font Utama:** Inter (dari Google Fonts via `next/font`)
  - Menggantikan Geist yang sudah di-setup di template
- **Font Alternatif (fallback):** system-ui, sans-serif
- **Font Mono (untuk rumus):** `font-mono` (Geist Mono tetap dipakai)

### Ukuran Teks

| Elemen | Class |
|---|---|
| Judul halaman | `text-2xl font-bold text-gray-900` |
| Sub-judul / card title | `text-lg font-semibold text-gray-800` |
| Label form | `text-sm font-medium text-gray-700` |
| Body teks | `text-sm text-gray-600` |
| Teks tabel | `text-sm text-gray-900` |
| Teks kecil / caption | `text-xs text-gray-500` |
| Rumus (monospace) | `font-mono text-sm` |

---

## 3. Komponen UI — Panduan Visual

### Card Statistik (Dashboard)

```
┌─────────────────────────────┐
│ 🟢  [ikon]                  │
│                             │
│  45                         │  ← angka besar (text-3xl font-bold)
│  Total Jenis Obat           │  ← label (text-sm text-gray-500)
└─────────────────────────────┘
Tailwind: bg-white rounded-xl shadow-sm border border-gray-100 p-6
```

**5 Varian Card:**
1. Total Jenis Obat → ikon box, biru
2. Stok Aman → ikon checkmark, hijau
3. Mendekati ROP → ikon warning, kuning
4. Harus Reorder → ikon alert, merah
5. Hampir Kedaluarsa → ikon calendar, oranye

### Tabel Data

```
┌─────────────────────────────────────────────────────────┐
│ Nama Obat    │ Kategori │ Stok │ ROP │ Status   │ Aksi │
├─────────────────────────────────────────────────────────┤
│ Paracetamol  │ Analgesik│ 500  │ 120 │ [AMAN ✓] │ ...  │
│ Amoxicillin  │ Antibiotik│ 45  │ 80  │ [REORDER]│ ...  │
└─────────────────────────────────────────────────────────┘
Tailwind: rounded-lg border border-gray-200 overflow-hidden
Header: bg-gray-50 text-xs font-medium text-gray-500 uppercase
Row hover: hover:bg-gray-50
```

### Tombol

| Varian | Class | Penggunaan |
|---|---|---|
| Primary | `bg-blue-600 hover:bg-blue-700 text-white` | Simpan, Tambah |
| Danger | `bg-red-600 hover:bg-red-700 text-white` | Hapus |
| Secondary | `border border-gray-300 bg-white hover:bg-gray-50 text-gray-700` | Batal, Kembali |
| Success | `bg-green-600 hover:bg-green-700 text-white` | Konfirmasi |
| Warning | `bg-yellow-500 hover:bg-yellow-600 text-white` | Hitung Ulang |

Ukuran: `px-4 py-2 rounded-lg text-sm font-medium transition-colors`

### Badge Status

```tsx
// AMAN
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  ● AMAN
</span>

// MENDEKATI ROP
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  ▲ MENDEKATI ROP
</span>

// HARUS REORDER
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  ✕ HARUS REORDER
</span>
```

### Alert / Notifikasi Reorder

```
┌────────────────────────────────────────────────────┐
│ ⚠️  STOK MENCAPAI ROP — SEGERA LAKUKAN PEMESANAN  │
│     Paracetamol 500mg: Stok 45 / ROP 80            │
│     EOQ: Pesan 300 unit                            │  [Tutup ×]
└────────────────────────────────────────────────────┘
bg-red-50 border border-red-200 rounded-lg
Posisi: fixed bottom-4 right-4 (toast), z-50
```

### Progress Bar Monitoring

```
Stok: 45 / ROP: 80  → 56% dari ROP
[=======                    ] 56%
Warna: merah (< 100% ROP) | kuning (100-120% ROP) | hijau (> 120% ROP)
```

### Form Input

```tsx
// Struktur form field yang konsisten
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700">Nama Obat *</label>
  <input
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  <p className="text-xs text-red-500">Nama obat wajib diisi</p>  {/* error state */}
</div>
```

---

## 4. Layout Sidebar

```
┌──────────────────┐
│ 💊 SIMO          │  ← logo + nama sistem
│ Apotek Rezky     │  ← nama apotek
├──────────────────┤
│ UTAMA            │  ← section header (text-xs uppercase gray-400)
│  📊 Dashboard    │  ← menu item aktif: bg-blue-50 text-blue-700
│  💊 Data Obat    │
├──────────────────┤
│ TRANSAKSI        │
│  ↑  Barang Masuk │
│  ↓  Barang Keluar│
├──────────────────┤
│ ANALITIK         │  (admin only)
│  📐 Perhitungan  │
│  🧪 Simulasi     │
│  📈 Analisis     │
│  📡 Monitoring   │
├──────────────────┤
│ LAPORAN          │
│  📄 Stok Harian  │
│  ... (sub-menu)  │
├──────────────────┤
│ PENGATURAN       │  (admin only)
│  👥 Manaj. User  │
│  ⚙️  Pengaturan  │
├──────────────────┤
│ 👤 Nama User     │  ← footer sidebar
│    Role: Admin   │
│    [Logout]      │
└──────────────────┘
Lebar sidebar: 256px
Tailwind: bg-white border-r border-gray-200 h-screen
```

---

## 5. Responsivitas

| Breakpoint | Perilaku |
|---|---|
| Desktop (lg+) | Sidebar selalu tampil di kiri |
| Tablet (md) | Sidebar collapse, muncul via hamburger button |
| Mobile (sm) | Sidebar sebagai drawer overlay |

---

## 6. Loading States

- **Skeleton loader** untuk tabel & card saat fetch data
- **Spinner** di dalam tombol saat submit form
- **Disabled** semua input saat request sedang berjalan

```tsx
// Skeleton baris tabel
<tr>
  <td><div className="h-4 bg-gray-200 rounded animate-pulse w-32" /></td>
  ...
</tr>
```

---

## 7. Empty States

Ketika tabel kosong (belum ada data):
```
┌───────────────────────────┐
│                           │
│    [📦 ikon box kosong]   │
│                           │
│  Belum ada data obat      │
│  Klik "Tambah Obat" untuk │
│  menambahkan data baru.   │
│                           │
│  [+ Tambah Obat]          │
└───────────────────────────┘
```

---

## 8. Format Angka

| Jenis | Format | Contoh |
|---|---|---|
| Rupiah | `Rp X.XXX.XXX` | `Rp 1.250.000` |
| Bilangan bulat | Separator ribuan titik | `1.200` |
| Desimal | 2 angka belakang koma | `12,86` |
| Persentase | 1 desimal + % | `95,0%` |
| Tanggal | `DD MMM YYYY` | `14 Mei 2026` |

Helper function di `lib/utils.ts`:
```ts
export const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export const formatAngka = (n: number) =>
  new Intl.NumberFormat('id-ID').format(n)

export const formatTanggal = (dateStr: string) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr))
```

---

## 9. Ikon

Gunakan **Lucide React** (sudah bundled dengan shadcn/ui):

| Ikon | Penggunaan |
|---|---|
| `Package` | Obat / persediaan |
| `TrendingDown` | Barang keluar |
| `TrendingUp` | Barang masuk |
| `AlertTriangle` | Warning / mendekati ROP |
| `XCircle` | Error / harus reorder |
| `CheckCircle` | Sukses / aman |
| `Calculator` | Perhitungan EOQ |
| `FlaskConical` | Simulasi |
| `BarChart3` | Analisis |
| `FileText` | Laporan |
| `Settings` | Pengaturan |
| `Users` | Manajemen user |
| `Truck` | Supplier |
| `CalendarX` | Kedaluarsa |
