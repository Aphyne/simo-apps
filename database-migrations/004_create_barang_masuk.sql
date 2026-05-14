-- Migration 004: Create barang_masuk table
-- Bergantung pada: 001_create_users.sql, 002_create_supplier.sql, 003_create_obat.sql

CREATE TABLE IF NOT EXISTS barang_masuk (
    id              SERIAL PRIMARY KEY,
    tanggal         DATE NOT NULL,
    obat_id         INTEGER NOT NULL REFERENCES obat(id) ON DELETE RESTRICT,
    jumlah_dus      DECIMAL(10, 2) NOT NULL,
    jumlah_satuan   INTEGER NOT NULL,
    supplier_id     INTEGER REFERENCES supplier(id) ON DELETE SET NULL,
    no_faktur       VARCHAR(50),
    expired_batch   DATE,
    catatan         TEXT,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    stok_sebelum    INTEGER NOT NULL DEFAULT 0,
    stok_sesudah    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barang_masuk_obat ON barang_masuk(obat_id);
CREATE INDEX IF NOT EXISTS idx_barang_masuk_tanggal ON barang_masuk(tanggal);
CREATE INDEX IF NOT EXISTS idx_barang_masuk_supplier ON barang_masuk(supplier_id);
