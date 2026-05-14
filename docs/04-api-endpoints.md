# Spesifikasi REST API — SIMO

Base URL: `http://localhost:8000/api`
Format: JSON
Auth header: `Authorization: Bearer <JWT>`
Backend: Node.js + Express.js

---

## Konvensi Response

### Sukses
```json
{
  "success": true,
  "data": { ... },
  "message": "Berhasil"
}
```

### Sukses dengan Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Pesan error yang jelas",
  "errors": { "field": ["Pesan validasi"] }  // opsional, untuk 422
}
```

---

## AUTH

### POST `/api/auth/login`
Tidak butuh token.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "admin",
      "nama": "Dr. Rezky",
      "role": "admin"
    }
  }
}
```

### POST `/api/auth/logout`
Requires token.

**Response 200:** `{ "success": true, "message": "Berhasil logout" }`

### GET `/api/auth/me`
Requires token. Mengembalikan data user yang sedang login.

---

## DASHBOARD

### GET `/api/dashboard/summary`
**Auth:** semua role

**Response:**
```json
{
  "success": true,
  "data": {
    "total_jenis_obat": 45,
    "stok_aman": 28,
    "mendekati_rop": 9,
    "harus_reorder": 8,
    "hampir_kedaluarsa": 3,
    "obat_mendesak": [
      {
        "id": 1,
        "kode": "OBT-001",
        "nama": "Paracetamol 500mg",
        "stok": 50,
        "rop": 120,
        "eoq": 300,
        "status": "HARUS_REORDER"
      }
    ]
  }
}
```

### GET `/api/dashboard/tren-permintaan`
**Query params:** `?bulan=6` (default 6 bulan)

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Des 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "Mei 2026"],
    "datasets": [
      {
        "kategori": "Analgesik",
        "data": [120, 135, 98, 150, 140, 160]
      },
      {
        "kategori": "Antibiotik",
        "data": [60, 70, 55, 80, 75, 85]
      }
    ]
  }
}
```

### GET `/api/dashboard/perbandingan-biaya`
Perbandingan biaya sebelum vs sesudah EOQ (dari analisis komparatif).

---

## OBAT (Data Master)

### GET `/api/obat`
**Auth:** semua role

**Query params:**
- `search` — cari nama/kode obat
- `kategori` — filter kategori
- `status` — `AMAN` | `MENDEKATI_ROP` | `HARUS_REORDER`
- `page`, `per_page`

**Response:** list obat dengan pagination

### POST `/api/obat`
**Auth:** admin only

**Request body:**
```json
{
  "nama": "Paracetamol 500mg",
  "kategori": "Analgesik",
  "satuan": "tablet",
  "satuan_per_dus": 100,
  "harga_beli": 500,
  "stok": 500,
  "biaya_pesan": 0,
  "biaya_simpan": 250,
  "lead_time": 3,
  "service_level": 95,
  "expired_terdekat": "2027-06-30",
  "supplier_id": 1
}
```

**Response 201:** data obat yang baru dibuat termasuk kode auto-generated + hasil kalkulasi EOQ/SS/ROP/TC

### GET `/api/obat/{id}`
**Auth:** semua role

**Response:** data obat lengkap + step-by-step perhitungan

### PUT `/api/obat/{id}`
**Auth:** admin only

**Request body:** sama dengan POST (field yang ingin diubah)

**Response:** data obat setelah update + kalkulasi ulang

### DELETE `/api/obat/{id}`
**Auth:** admin only

**Response 200** jika sukses, **409 Conflict** jika obat masih punya transaksi

### GET `/api/obat/{id}/perhitungan`
**Auth:** semua role

Step-by-step perhitungan manual format skripsi:

**Response:**
```json
{
  "success": true,
  "data": {
    "obat": { "id": 1, "nama": "Paracetamol 500mg" },
    "input": {
      "D": 1200, "S": 0, "H": 250, "LT": 3,
      "Z": 1.65, "sigma": 4.5
    },
    "langkah_eoq": {
      "rumus": "EOQ = √(2 × D × S / H)",
      "substitusi": "EOQ = √(2 × 1200 × 0 / 250)",
      "hasil": 0,
      "catatan": "EOQ = 0 karena biaya pesan = 0. Sistem menggunakan order minimal 1 dus."
    },
    "langkah_safety_stock": {
      "rumus": "SS = Z × σ × √LT",
      "substitusi": "SS = 1.65 × 4.5 × √3",
      "langkah": "= 1.65 × 4.5 × 1.732 = 12.86",
      "hasil": 12.86
    },
    "langkah_rop": {
      "rumus": "ROP = (D_harian × LT) + SS",
      "substitusi": "ROP = (3.29 × 3) + 12.86",
      "langkah": "= 9.86 + 12.86 = 22.72",
      "hasil": 22.72
    },
    "langkah_tc": {
      "rumus": "TC = (D/Q × S) + (Q/2 × H)",
      "hasil": 0
    }
  }
}
```

### POST `/api/obat/{id}/hitung-ulang`
**Auth:** admin only

Memicu kalkulasi ulang EOQ/SS/ROP/TC berdasarkan data terbaru.

---

## BARANG MASUK

### GET `/api/barang-masuk`
**Query params:** `obat_id`, `supplier_id`, `tanggal_dari`, `tanggal_sampai`, `page`, `per_page`

### POST `/api/barang-masuk`
**Auth:** admin, staf

**Request body:**
```json
{
  "tanggal": "2026-05-14",
  "obat_id": 1,
  "jumlah_dus": 5,
  "supplier_id": 1,
  "no_faktur": "SP/2026/001",
  "expired_batch": "2027-12-31",
  "catatan": null
}
```

**Response:** transaksi + stok terbaru + flag `stok_aman_kembali: true/false`

Konversi otomatis di backend: `jumlah_satuan = jumlah_dus × obat.satuan_per_dus`

### GET `/api/barang-masuk/{id}`
### DELETE `/api/barang-masuk/{id}`
**Auth:** admin only (staf tidak bisa hapus)

---

## BARANG KELUAR

### GET `/api/barang-keluar`
**Query params:** `obat_id`, `keterangan`, `tanggal_dari`, `tanggal_sampai`, `page`, `per_page`

### POST `/api/barang-keluar`
**Auth:** admin, staf

**Request body:**
```json
{
  "tanggal": "2026-05-14",
  "obat_id": 1,
  "jumlah": 20,
  "keterangan": "Penjualan",
  "catatan": null
}
```

**Response:**
```json
{
  "success": true,
  "data": { "transaksi": { ... }, "stok_sesudah": 480 },
  "reorder_alert": true,                // true jika stok ≤ ROP setelah transaksi
  "reorder_info": {
    "stok": 480,
    "rop": 500,
    "eoq": 300,
    "nama_obat": "Paracetamol 500mg"
  }
}
```

### GET `/api/barang-keluar/{id}`
### DELETE `/api/barang-keluar/{id}`
**Auth:** admin only

---

## SIMULASI SKENARIO

### POST `/api/simulasi/jalankan`
**Auth:** admin only
**Tidak menyimpan ke database.**

**Request body:**
```json
{
  "obat_id": 1,
  "demand_perubahan_pct": 20,
  "lead_time_baru": null,
  "biaya_simpan_baru": null,
  "biaya_pesan_baru": null
}
```

**Response:** perbandingan nilai sekarang vs simulasi (format lihat skema DB)

### GET `/api/simulasi`
**Auth:** admin only

List semua skenario tersimpan. **Query params:** `obat_id`, `page`

### POST `/api/simulasi/simpan`
**Auth:** admin only

**Request body:**
```json
{
  "obat_id": 1,
  "nama_skenario": "Kenaikan demand 20% musim flu",
  "parameter_input": { ... },
  "hasil_simulasi": { ... }
}
```

### DELETE `/api/simulasi/{id}`
**Auth:** admin only

---

## MONITORING STOK

### GET `/api/monitoring`
**Auth:** semua role

**Query params:** `filter` = `semua` | `reorder` | `kedaluarsa`

**Response:** list obat dengan info estimasi habis + status

---

## ANALISIS KOMPARATIF

### GET `/api/analisis/kondisi-sesudah`
Data kondisi sesudah sistem (dari data aktual).

### POST `/api/analisis/simpan-kondisi-sebelum`
**Auth:** admin only

Input kondisi sebelum sistem (dari arsip SP apotek).

### GET `/api/analisis/perbandingan`
Hasil perbandingan lengkap sebelum vs sesudah.

---

## LAPORAN

### GET `/api/laporan/stok-harian`
**Query params:** `tanggal`, `kategori`, `status`

### GET `/api/laporan/barang-masuk`
**Query params:** `tanggal_dari`, `tanggal_sampai`, `obat_id`, `supplier_id`

### GET `/api/laporan/barang-keluar`
**Query params:** `tanggal_dari`, `tanggal_sampai`, `obat_id`, `keterangan`

### GET `/api/laporan/kedaluarsa`
**Query params:** `hari` (default 90)

### GET `/api/laporan/eoq-rop`
List semua obat dengan detail perhitungan.

### GET `/api/laporan/simulasi`
List semua skenario tersimpan.

> Export PDF/Excel dilakukan di **frontend** menggunakan jsPDF dan xlsx. Backend hanya mengembalikan data JSON.

---

## SUPPLIER

### GET `/api/supplier`
### POST `/api/supplier`
### GET `/api/supplier/{id}`
### PUT `/api/supplier/{id}`
### DELETE `/api/supplier/{id}`
### GET `/api/supplier/{id}/riwayat`
Riwayat pemesanan (barang masuk) per supplier.

**Auth:** GET semua role, POST/PUT/DELETE admin only

---

## USER MANAGEMENT

### GET `/api/users`
**Auth:** admin only

### POST `/api/users`
**Request:**
```json
{
  "username": "staf01",
  "password": "password",
  "nama": "Nama Staf",
  "role": "staf"
}
```

### PUT `/api/users/{id}`
### DELETE `/api/users/{id}`
### POST `/api/users/{id}/reset-password`
```json
{ "password_baru": "newpassword" }
```

**Auth:** admin only

---

## PENGATURAN

### GET `/api/pengaturan`
**Auth:** semua role (untuk membaca nama apotek, dll)

### PUT `/api/pengaturan`
**Auth:** admin only

**Request:**
```json
{
  "nama_apotek": "Apotek Rezky Medika",
  "alamat_apotek": "Jl. Gunung Salju No. 14...",
  "nama_apj": "...",
  "default_service_level": 95,
  "default_lead_time": 3,
  "default_biaya_pesan": 0,
  "threshold_expired_hari": 90
}
```

---

## HTTP Status Code Mapping

| Code | Arti |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (belum login / token expired) |
| 403 | Forbidden (role tidak cukup) |
| 404 | Not Found |
| 409 | Conflict (misal: hapus obat yang masih punya transaksi) |
| 422 | Unprocessable Entity (validasi gagal) |
| 500 | Internal Server Error |
