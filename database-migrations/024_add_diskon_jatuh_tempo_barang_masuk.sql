-- Migration 024: diskon per baris obat dan jatuh tempo per faktur pada barang_masuk
--
-- diskon_pct   : diskon persen per baris obat, dipotong dari harga beli SEBELUM PPN.
--                harga_beli (per satuan, tersimpan) = harga_beli_dus x (1 - diskon/100) x (1 + ppn/100) / isi_per_dus
-- jatuh_tempo  : tanggal jatuh tempo pembayaran faktur ke PBF. Disimpan di setiap baris faktur yang sama
--                (belum ada tabel faktur); mengubahnya lewat form Ubah memperbarui semua baris faktur itu.
--
-- Aditif dan tidak destruktif: baris lama mendapat diskon 0 dan jatuh tempo kosong. Diterapkan manual
-- setelah Boss setuju (jangan `migrate up`, lihat CLAUDE.md).

ALTER TABLE barang_masuk
  ADD COLUMN IF NOT EXISTS diskon_pct  DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jatuh_tempo DATE;
