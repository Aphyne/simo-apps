-- Migration 011: Tambah kolom harga_jual ke tabel obat

ALTER TABLE obat ADD COLUMN IF NOT EXISTS harga_jual DECIMAL(12, 2) NOT NULL DEFAULT 0;
