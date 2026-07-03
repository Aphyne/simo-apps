-- Migration 013: Tambah harga_beli dan harga_jual ke barang_masuk
-- Harga dicatat per transaksi masuk (dinamis per batch/pengiriman)
-- obat.harga_beli & obat.harga_jual akan auto-update ke nilai terbaru

ALTER TABLE barang_masuk
  ADD COLUMN IF NOT EXISTS harga_beli DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS harga_jual DECIMAL(12, 2);
