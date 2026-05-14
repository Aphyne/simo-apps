-- Migration 003: Create obat table
-- Bergantung pada: 002_create_supplier.sql

CREATE TABLE IF NOT EXISTS obat (
    id                  SERIAL PRIMARY KEY,
    kode                VARCHAR(20) UNIQUE NOT NULL,
    nama                VARCHAR(150) NOT NULL,
    kategori            VARCHAR(50) NOT NULL,
    satuan              VARCHAR(20) NOT NULL,
    satuan_per_dus      INTEGER NOT NULL DEFAULT 1,
    harga_beli          DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Stok dalam satuan terkecil
    stok                INTEGER NOT NULL DEFAULT 0,

    -- Parameter input kalkulasi EOQ/ROP
    biaya_pesan         DECIMAL(12, 2) NOT NULL DEFAULT 0,
    biaya_simpan        DECIMAL(12, 2) NOT NULL DEFAULT 0,
    lead_time           INTEGER NOT NULL DEFAULT 1,
    service_level       DECIMAL(5, 2) NOT NULL DEFAULT 95.00,

    -- Hasil kalkulasi (di-cache, diupdate otomatis)
    eoq                 DECIMAL(10, 2),
    safety_stock        DECIMAL(10, 2),
    rop                 DECIMAL(10, 2),
    total_biaya         DECIMAL(15, 2),

    -- Statistik demand (dari 30 hari terakhir barang keluar jenis Penjualan)
    demand_harian       DECIMAL(10, 4) DEFAULT 0,
    std_dev_demand      DECIMAL(10, 4) DEFAULT 0,
    demand_tahunan      DECIMAL(10, 2) DEFAULT 0,

    -- Informasi tambahan
    expired_terdekat    DATE,
    supplier_id         INTEGER REFERENCES supplier(id) ON DELETE SET NULL,
    nama_supplier       VARCHAR(100),

    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obat_nama ON obat(nama);
CREATE INDEX IF NOT EXISTS idx_obat_kategori ON obat(kategori);
CREATE INDEX IF NOT EXISTS idx_obat_kode ON obat(kode);
-- Index komposit untuk query status stok (stok vs rop)
CREATE INDEX IF NOT EXISTS idx_obat_stok_rop ON obat(stok, rop);
CREATE INDEX IF NOT EXISTS idx_obat_expired ON obat(expired_terdekat);
