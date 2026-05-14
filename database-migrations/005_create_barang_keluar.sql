-- Migration 005: Create barang_keluar table
-- Bergantung pada: 001_create_users.sql, 003_create_obat.sql

CREATE TABLE IF NOT EXISTS barang_keluar (
    id              SERIAL PRIMARY KEY,
    tanggal         DATE NOT NULL,
    obat_id         INTEGER NOT NULL REFERENCES obat(id) ON DELETE RESTRICT,
    jumlah          INTEGER NOT NULL,
    keterangan      VARCHAR(20) NOT NULL
                    CHECK (keterangan IN ('Penjualan', 'Retur', 'Rusak', 'Kedaluarsa', 'Lainnya')),
    catatan         TEXT,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    stok_sebelum    INTEGER NOT NULL DEFAULT 0,
    stok_sesudah    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barang_keluar_obat ON barang_keluar(obat_id);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_tanggal ON barang_keluar(tanggal);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_keterangan ON barang_keluar(keterangan);
-- Index untuk query demand (30 hari terakhir, hanya Penjualan)
CREATE INDEX IF NOT EXISTS idx_barang_keluar_demand
    ON barang_keluar(obat_id, tanggal, keterangan)
    WHERE keterangan = 'Penjualan';
