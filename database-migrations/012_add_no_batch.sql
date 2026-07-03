-- Migration 012: Tambah kolom no_batch ke tabel barang_masuk

ALTER TABLE barang_masuk
  ADD COLUMN IF NOT EXISTS no_batch VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_barang_masuk_no_batch ON barang_masuk(no_batch);
