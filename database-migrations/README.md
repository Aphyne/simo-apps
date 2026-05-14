# Database Migrations — SIMO

Migration dijalankan via **CLI** menggunakan Node.js script (`migrate.js`) yang terhubung langsung ke Neon PostgreSQL.

---

## Setup Pertama Kali

### 1. Salin file `.env`
```bash
cd database-migrations
cp .env.example .env
```

Isi `.env` dengan connection string dari Neon Console:
```env
DATABASE_URL=postgresql://username:password@your-project.neon.tech/dbname?sslmode=require
```

> Ambil connection string dari: **Neon Console → Project → Connection Details → Connection string**

### 2. Install dependencies
```bash
# Via Makefile (dari root workspace):
make db-install

# Atau langsung:
cd database-migrations && npm install
```

---

## Commands

Semua command bisa dijalankan dari **root workspace** via `make`, atau dari folder `database-migrations/` via `node migrate.js`.

| Make Command | Node Command | Fungsi |
|---|---|---|
| `make db-migrate` | `node migrate.js up` | Jalankan migration yang belum dijalankan |
| `make db-seed` | `node migrate.js seed` | Jalankan seed data yang belum dijalankan |
| `make db-fresh` | `node migrate.js fresh` | Drop semua tabel → migrate → seed ulang |
| `make db-reset` | `node migrate.js reset` | Drop semua tabel (tanpa re-migrate) |
| `make db-status` | `node migrate.js status` | Tampilkan status setiap file |

### Alur Normal (Pertama Kali)
```bash
make db-migrate   # buat semua tabel
make db-seed      # isi data awal
make db-status    # verifikasi semua ✓
```

### Reset Database (Dev)
```bash
make db-fresh     # drop semua + migrate + seed ulang
```

---

## Struktur File SQL

File diurutkan dan dijalankan secara berurutan berdasarkan prefix angka:

| File | Tipe | Isi |
|---|---|---|
| `001_create_users.sql` | Migration | Tabel users |
| `002_create_supplier.sql` | Migration | Tabel supplier |
| `003_create_obat.sql` | Migration | Tabel obat |
| `004_create_barang_masuk.sql` | Migration | Tabel barang_masuk |
| `005_create_barang_keluar.sql` | Migration | Tabel barang_keluar |
| `006_create_simulasi_skenario.sql` | Migration | Tabel simulasi_skenario |
| `007_create_pengaturan.sql` | Migration | Tabel pengaturan |
| `008_seed_users.sql` | Seed | User admin & staf default |
| `009_seed_pengaturan.sql` | Seed | Pengaturan sistem default |
| `010_seed_obat_contoh.sql` | Seed | 10 obat contoh + 3 supplier |

**Konvensi penamaan:**
- File migration: `NNN_create_*.sql` atau `NNN_add_*.sql` (tidak mengandung `_seed_`)
- File seed: `NNN_seed_*.sql`

---

## Tracking

Script otomatis membuat tabel `_migrations` di database untuk tracking file yang sudah dijalankan. File yang sudah dijalankan tidak akan dijalankan ulang kecuali pakai `fresh`.
