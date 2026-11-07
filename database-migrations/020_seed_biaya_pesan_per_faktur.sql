-- Migration 020: Seed pengaturan Biaya Pesan per Faktur
-- Biaya admin/ongkos kirim per SEKALI PESAN (faktur), bukan per obat. Kalau 1
-- faktur berisi beberapa obat sekaligus, biaya ini dibagi rata ke tiap obat
-- yang ada di faktur itu (lihat barangMasukController.js) supaya total biaya
-- pesan tidak melebih-hitung saat EOQ dihitung per obat.

INSERT INTO pengaturan (key, value, deskripsi) VALUES
('biaya_pesan_per_faktur', '5000', 'Biaya pemesanan per faktur (Rp) — dibagi rata ke tiap obat dalam faktur yang sama saat Stok Masuk dicatat')
ON CONFLICT (key) DO UPDATE SET
    value      = EXCLUDED.value,
    deskripsi  = EXCLUDED.deskripsi,
    updated_at = NOW();
