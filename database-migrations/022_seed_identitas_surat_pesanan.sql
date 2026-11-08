-- Migration 022: Identitas apotek untuk Surat Pesanan (pesan WhatsApp reorder)
-- Sumber: kop & tanda tangan di surat-pesanan.jpeg (docs/data-apotek).
-- Idempotent: tidak menimpa nilai yang sudah diubah manual lewat halaman Pengaturan.

INSERT INTO pengaturan (key, value, deskripsi) VALUES
('nomor_sia',      '2505220006548',                       'Nomor SIA (Surat Izin Apotek) — tampil di kop Surat Pesanan'),
('nomor_sipa_apj', '012/SIPA/III-DPMPTSP/2022',           'Nomor SIPA Apoteker Penanggung Jawab — tampil di tanda tangan Surat Pesanan'),
('kota_apotek',    'Manokwari',                           'Kota untuk baris tanggal Surat Pesanan ("Manokwari, 9 November 2026")')
ON CONFLICT (key) DO NOTHING;

-- nama_apj sebelumnya hanya placeholder bawaan seed; isi dengan nama di surat pesanan
-- hanya kalau masih placeholder itu.
UPDATE pengaturan
SET value = 'Apt. Marsita Ani Atmaja, S.Far', updated_at = NOW()
WHERE key = 'nama_apj' AND value = 'Apoteker Penanggung Jawab';
