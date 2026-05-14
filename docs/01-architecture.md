# Arsitektur Sistem SIMO

## 1. Gambaran Umum

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                   Browser (Chrome, Firefox, dll)                 │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Next.js 16 (App Router)                    │   │
│   │     TypeScript · Tailwind CSS v4 · Recharts             │   │
│   │     Zustand (state) · React Query (data fetching)       │   │
│   └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                               │ HTTP/HTTPS (JSON REST API)
                               │ Authorization: Bearer <JWT>
┌─────────────────────────────┼───────────────────────────────────┐
│                        SERVER LAYER                              │
│   ┌──────────────────────────▼──────────────────────────────┐   │
│   │           Node.js Backend (Express.js)                  │   │
│   │     Routes · Controllers · Services · Middleware        │   │
│   │     JWT Auth · Role Guard · Input Validation            │   │
│   └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                               │ pg (node-postgres)
┌─────────────────────────────┼───────────────────────────────────┐
│                       DATABASE LAYER                             │
│   ┌──────────────────────────▼──────────────────────────────┐   │
│   │              Neon PostgreSQL (Cloud)                    │   │
│   │     7 tabel utama · Indeks · Foreign key constraints    │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Detail

### Frontend — `/simo`

| Teknologi | Versi | Kegunaan |
|---|---|---|
| Next.js | 16.2.6 | Framework React (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | v4 | Utility-first styling |
| Zustand | latest | Client-side state management |
| React Query (TanStack) | v5 | Server state, caching, refetch |
| Axios | latest | HTTP client ke backend |
| Recharts | latest | Grafik (line chart, bar chart) |
| React Hook Form | latest | Form handling & validasi |
| Zod | latest | Schema validation |
| shadcn/ui | latest | Komponen UI (dialog, toast, table, dll) |
| date-fns | latest | Manipulasi tanggal |
| jsPDF + xlsx | latest | Export PDF dan Excel |

### Backend — `/backend`

| Teknologi | Versi | Kegunaan |
|---|---|---|
| Node.js | ^20 | Runtime |
| Express.js | ^5 | Web framework |
| jsonwebtoken | latest | JWT auth (sign & verify) |
| bcryptjs | latest | Password hashing |
| pg (node-postgres) | latest | Koneksi ke Neon PostgreSQL |
| express-validator | latest | Input validation |
| cors | latest | CORS middleware |
| dotenv | latest | Environment variables |
| nodemon | dev | Auto-restart saat development |

### Database — Neon PostgreSQL

| Komponen | Detail |
|---|---|
| Provider | Neon (cloud PostgreSQL) |
| Versi | PostgreSQL 16 |
| Connection | `DATABASE_URL` via `.env` |
| Migrations | Raw SQL di `/database-migrations` |
| Query | Raw SQL via `pg.Pool` (tidak pakai ORM) |

---

## 3. Alur Data Utama

### 3.1 Alur Login
```
User → POST /api/auth/login (username, password)
     → Backend cek credential di DB, compare bcrypt
     → Return JWT token + user data
     → Frontend simpan token di localStorage + cookie (simo_token)
     → Redirect ke /dashboard
```

### 3.2 Alur Input Barang Keluar (Trigger Kalkulasi Ulang)
```
Staf → POST /api/barang-keluar (obat_id, jumlah, keterangan)
     → Backend: kurangi stok obat
     → Backend: hitung ulang demand_harian & std_dev dari 30 hari terakhir
     → Backend: hitung ulang EOQ, Safety Stock, ROP, TC
     → Backend: update status stok
     → Backend: cek apakah stok ≤ ROP?
         → Jika ya: return response dengan flag `reorder_alert: true`
     → Frontend: tampilkan alert merah jika reorder_alert
     → Frontend: invalidate React Query cache → refetch data terbaru
```

### 3.3 Alur Simulasi Skenario
```
User → Pilih obat → Lihat nilai aktual (D, S, H, LT, EOQ, ROP, SS, TC)
     → Input parameter simulasi (% perubahan atau nilai baru)
     → POST /api/simulasi/jalankan (TIDAK menyimpan ke database)
     → Backend: hitung EOQ, SS, ROP, TC dengan parameter baru
     → Backend: return hasil perbandingan (nilai lama vs baru)
     → Frontend: tampilkan tabel perbandingan + bar chart
     → User (opsional): POST /api/simulasi/simpan
     → Backend: simpan ke tabel simulasi_skenario (hanya hasil, tidak ubah data obat)
```

### 3.4 Alur Export Laporan
```
User → Pilih jenis laporan + filter (tanggal, kategori, dll)
     → GET /api/laporan/{type}?params...
     → Backend: query data + format response
     → Frontend: generate PDF (jsPDF) atau Excel (xlsx) di browser
```

---

## 4. Autentikasi & Otorisasi

### Mekanisme
- JWT (jsonwebtoken) untuk token-based auth
- Token dikirim via `Authorization: Bearer <token>` header
- Token disimpan di frontend (localStorage + cookie `simo_token`)
- Cookie digunakan Next.js middleware untuk proteksi route SSR

### Role Guard
```js
// middleware/roleMiddleware.js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    next();
  };
}

// Contoh pemakaian di route
router.post('/obat', verifyToken, requireRole('admin'), obatController.create);
router.get('/obat',  verifyToken, requireRole('admin', 'staf'), obatController.index);
```

### Pembatasan Akses per Role

| Fitur | Admin | Staf |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Data Master Obat (lihat) | ✅ | ✅ |
| Data Master Obat (tambah/edit/hapus) | ✅ | ❌ |
| Barang Masuk (input) | ✅ | ✅ |
| Barang Keluar (input) | ✅ | ✅ |
| Laporan (lihat) | ✅ | ✅ |
| Laporan (export) | ✅ | ✅ |
| Perhitungan EOQ/ROP | ✅ | ✅ |
| Simulasi Skenario | ✅ | ❌ |
| Analisis Komparatif | ✅ | ❌ |
| Manajemen Supplier | ✅ | ✅ lihat |
| Manajemen User | ✅ | ❌ |
| Pengaturan Sistem | ✅ | ❌ |

---

## 5. Environment Variables

### Frontend (`/simo/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=SIMO - Apotek Rezky Medika
```

### Backend (`/backend/.env`)
```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

---

## 6. Konvensi Penamaan

| Konteks | Konvensi | Contoh |
|---|---|---|
| JS File/Module | camelCase | `eoqService.js`, `authController.js` |
| JS Function | camelCase | `hitungUlang()`, `getStokAman()` |
| JS Class | PascalCase | `EoqService` (jika pakai class) |
| Database Table | snake_case | `barang_masuk`, `simulasi_skenario` |
| Database Column | snake_case | `stok_sesudah`, `lead_time` |
| API Endpoint | kebab-case | `/api/barang-masuk`, `/api/eoq-rop` |
| Next.js Route | kebab-case | `/barang-masuk`, `/monitoring-stok` |
| TS/React Component | PascalCase | `ObatTable`, `SimulasiForm` |
| TS Variable/Function | camelCase | `hitungEoq()`, `totalBiaya` |
| Tailwind Class | (framework) | `bg-blue-600`, `text-red-500` |
