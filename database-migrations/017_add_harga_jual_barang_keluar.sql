-- Migration 017: Tambah kolom harga_jual ke barang_keluar
-- Harga dicatat per transaksi keluar (snapshot harga obat SAAT itu transaksi terjadi),
-- bukan ikut harga_jual obat yang terus berubah — supaya histori penjualan lama tetap
-- akurat walau harga jual obat berubah di kemudian hari.
-- Lihat juga 013_add_harga_barang_masuk.sql untuk pola yang sama di sisi Barang Masuk.

ALTER TABLE barang_keluar
  ADD COLUMN IF NOT EXISTS harga_jual DECIMAL(12, 2);
