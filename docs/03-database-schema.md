# Skema Database PostgreSQL — SIMO

Database: **Neon PostgreSQL**
Query: Raw SQL via `pg` (node-postgres) — tidak pakai ORM

---

## ERD (Entity Relationship Diagram)

```
users ──────────────────────────────────────────────┐
  │                                                  │
  │ (created_by)                                     │
  ▼                                                  │
barang_masuk ──── obat ──── barang_keluar            │
                   │                                 │
                   │ (supplier_id)                   │
                   ▼                                 │
               supplier                              │
                                                     │
simulasi_skenario ◄──── obat                         │
        │                                            │
        └────────────────────── users ───────────────┘

pengaturan (standalone — key-value store)
```

---

## Tabel 1: `users`

```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,           -- bcrypt hash
    nama        VARCHAR(100) NOT NULL,
    role        VARCHAR(10) NOT NULL             -- 'admin' | 'staf'
                CHECK (role IN ('admin', 'staf')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
```

**Catatan:**
- Password wajib di-hash dengan bcrypt (cost factor 12) di backend, jangan pernah simpan plain text
- `is_active = FALSE` untuk soft-disable user tanpa menghapus history

---

## Tabel 2: `supplier`

```sql
CREATE TABLE supplier (
    id              SERIAL PRIMARY KEY,
    nama            VARCHAR(100) NOT NULL,
    alamat          TEXT,
    telepon         VARCHAR(20),
    whatsapp        VARCHAR(20),
    jenis_obat      TEXT,                        -- deskripsi bebas jenis obat yang disediakan
    lead_time_avg   INTEGER NOT NULL DEFAULT 1,  -- rata-rata lead time dalam hari
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Tabel 3: `obat`

Ini tabel utama. Kolom `eoq`, `safety_stock`, `rop`, `total_biaya`, `demand_harian`, `std_dev_demand`, `demand_tahunan` adalah hasil kalkulasi yang di-cache di sini agar tidak perlu hitung ulang setiap query.

```sql
CREATE TABLE obat (
    id                  SERIAL PRIMARY KEY,
    kode                VARCHAR(20) UNIQUE NOT NULL,    -- auto-generate: OBT-001, OBT-002, ...
    nama                VARCHAR(150) NOT NULL,
    kategori            VARCHAR(50) NOT NULL,           -- 'Analgesik', 'Antibiotik', 'Vitamin', dll
    satuan              VARCHAR(20) NOT NULL,           -- 'tablet', 'kapsul', 'botol', 'strip', dll
    satuan_per_dus      INTEGER NOT NULL DEFAULT 1,    -- misal: 1 dus = 100 tablet
    harga_beli          DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Stok
    stok                INTEGER NOT NULL DEFAULT 0,    -- dalam satuan terkecil

    -- Parameter input kalkulasi
    biaya_pesan         DECIMAL(12, 2) NOT NULL DEFAULT 0,   -- S: biaya pemesanan per order (Rp)
    biaya_simpan        DECIMAL(12, 2) NOT NULL DEFAULT 0,   -- H: biaya penyimpanan per unit/tahun (Rp)
    lead_time           INTEGER NOT NULL DEFAULT 1,          -- LT dalam hari
    service_level       DECIMAL(5, 2) NOT NULL DEFAULT 95.00, -- % (95 → Z = 1.65)

    -- Hasil kalkulasi (di-update otomatis setiap ada perubahan demand)
    eoq                 DECIMAL(10, 2),
    safety_stock        DECIMAL(10, 2),
    rop                 DECIMAL(10, 2),
    total_biaya         DECIMAL(15, 2),

    -- Statistik demand (dihitung dari 30 hari terakhir barang keluar jenis Penjualan)
    demand_harian       DECIMAL(10, 4),   -- rata-rata unit keluar per hari
    std_dev_demand      DECIMAL(10, 4),   -- standar deviasi permintaan harian
    demand_tahunan      DECIMAL(10, 2),   -- demand_harian × 365

    -- Informasi tambahan
    expired_terdekat    DATE,             -- tanggal kedaluarsa batch yang paling dekat
    supplier_id         INTEGER REFERENCES supplier(id) ON DELETE SET NULL,
    nama_supplier       VARCHAR(100),     -- denormalized untuk kemudahan tampilan

    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_obat_nama ON obat(nama);
CREATE INDEX idx_obat_kategori ON obat(kategori);
CREATE INDEX idx_obat_status ON obat(stok, rop);   -- untuk query status stok
```

**Aturan status stok (computed, bukan kolom):**
```
stok > rop                          → AMAN
stok > rop AND stok <= rop * 1.2   → MENDEKATI ROP
stok <= rop                         → HARUS REORDER
```

**Format kode obat:** `OBT-` + 3 digit (padded), contoh: `OBT-001`, `OBT-042`

---

## Tabel 4: `barang_masuk`

```sql
CREATE TABLE barang_masuk (
    id              SERIAL PRIMARY KEY,
    tanggal         DATE NOT NULL,
    obat_id         INTEGER NOT NULL REFERENCES obat(id) ON DELETE RESTRICT,
    jumlah_dus      DECIMAL(10, 2) NOT NULL,    -- jumlah masuk dalam satuan dus
    jumlah_satuan   INTEGER NOT NULL,           -- hasil konversi: jumlah_dus × satuan_per_dus
    supplier_id     INTEGER REFERENCES supplier(id) ON DELETE SET NULL,
    no_faktur       VARCHAR(50),
    expired_batch   DATE,                       -- tanggal kedaluarsa batch ini
    catatan         TEXT,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    stok_sebelum    INTEGER NOT NULL,           -- snapshot stok sebelum transaksi
    stok_sesudah    INTEGER NOT NULL,           -- snapshot stok sesudah transaksi
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barang_masuk_obat ON barang_masuk(obat_id);
CREATE INDEX idx_barang_masuk_tanggal ON barang_masuk(tanggal);
CREATE INDEX idx_barang_masuk_supplier ON barang_masuk(supplier_id);
```

---

## Tabel 5: `barang_keluar`

```sql
CREATE TABLE barang_keluar (
    id              SERIAL PRIMARY KEY,
    tanggal         DATE NOT NULL,
    obat_id         INTEGER NOT NULL REFERENCES obat(id) ON DELETE RESTRICT,
    jumlah          INTEGER NOT NULL,           -- jumlah keluar dalam satuan terkecil
    keterangan      VARCHAR(20) NOT NULL
                    CHECK (keterangan IN ('Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya')),
    catatan         TEXT,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    stok_sebelum    INTEGER NOT NULL,           -- snapshot stok sebelum transaksi
    stok_sesudah    INTEGER NOT NULL,           -- snapshot stok sesudah transaksi
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barang_keluar_obat ON barang_keluar(obat_id);
CREATE INDEX idx_barang_keluar_tanggal ON barang_keluar(tanggal);
CREATE INDEX idx_barang_keluar_keterangan ON barang_keluar(keterangan);
```

> **Penting:** Hanya baris dengan `keterangan = 'Penjualan'` yang digunakan untuk menghitung demand. Keterangan lain (Retur, Rusak, dll) tidak masuk perhitungan EOQ/ROP.

---

## Tabel 6: `simulasi_skenario`

```sql
CREATE TABLE simulasi_skenario (
    id                  SERIAL PRIMARY KEY,
    obat_id             INTEGER NOT NULL REFERENCES obat(id) ON DELETE CASCADE,
    nama_skenario       VARCHAR(100),           -- nama bebas yang diberikan user
    parameter_input     JSONB NOT NULL,         -- parameter yang diubah user
    hasil_simulasi      JSONB NOT NULL,         -- hasil perbandingan sekarang vs simulasi
    tanggal             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_simulasi_obat ON simulasi_skenario(obat_id);
CREATE INDEX idx_simulasi_user ON simulasi_skenario(user_id);
```

**Struktur `parameter_input` (JSONB):**
```json
{
  "demand_perubahan_pct": 20,         // % kenaikan/penurunan demand (opsional)
  "demand_nilai_baru": null,          // atau nilai demand langsung (opsional)
  "lead_time_baru": 5,                // hari (opsional)
  "biaya_simpan_baru": 1500,          // Rp (opsional)
  "biaya_pesan_baru": 50000           // Rp (opsional)
}
```

**Struktur `hasil_simulasi` (JSONB):**
```json
{
  "nilai_sekarang": {
    "demand_tahunan": 1200,
    "eoq": 78.99,
    "safety_stock": 12.5,
    "rop": 45.3,
    "total_biaya": 125000
  },
  "nilai_simulasi": {
    "demand_tahunan": 1440,
    "eoq": 86.57,
    "safety_stock": 15.0,
    "rop": 55.0,
    "total_biaya": 148500
  },
  "selisih": {
    "demand_tahunan_pct": 20,
    "eoq_unit": 7.58,
    "safety_stock_unit": 2.5,
    "rop_unit": 9.7,
    "total_biaya_rp": 23500
  }
}
```

---

## Tabel 7: `pengaturan`

```sql
CREATE TABLE pengaturan (
    id          SERIAL PRIMARY KEY,
    key         VARCHAR(50) UNIQUE NOT NULL,
    value       TEXT NOT NULL,
    deskripsi   TEXT,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Data awal (seed):**

| key | value | deskripsi |
|---|---|---|
| `nama_apotek` | Apotek Rezky Medika | Nama apotek |
| `alamat_apotek` | Jl. Gunung Salju No. 14, Fanindi Bengkel Tan, Manokwari | Alamat |
| `nama_apj` | (nama APJ) | Nama Apoteker Penanggung Jawab |
| `default_service_level` | 95 | Service level default (%) |
| `default_lead_time` | 3 | Lead time default (hari) |
| `default_biaya_pesan` | 0 | Biaya pemesanan default (Rp) |
| `threshold_expired_hari` | 90 | Peringatan kedaluarsa N hari sebelum |

---

## Tabel Z-Score Referensi

| Service Level | Z-Score |
|---|---|
| 90% | 1.28 |
| 95% | 1.65 |
| 97% | 1.88 |
| 99% | 2.33 |

Mapping Z-score diimplementasikan di `EoqService.php` sebagai fungsi lookup, bukan disimpan di database.

---

## Relasi Ringkasan

```
users          1 ←── * barang_masuk
users          1 ←── * barang_keluar
users          1 ←── * simulasi_skenario
supplier       1 ←── * obat
supplier       1 ←── * barang_masuk
obat           1 ←── * barang_masuk
obat           1 ←── * barang_keluar
obat           1 ←── * simulasi_skenario
```
