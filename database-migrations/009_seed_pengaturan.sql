-- Seed 009: Pengaturan sistem default

INSERT INTO pengaturan (key, value, deskripsi) VALUES
('nama_apotek',           'Apotek Rezky Medika',                                              'Nama apotek yang ditampilkan di sistem dan laporan'),
('alamat_apotek',         'Jalan Gunung Salju Nomor 14, Fanindi Bengkel Tan, Manokwari, Papua Barat', 'Alamat lengkap apotek'),
('nama_apj',              'Apoteker Penanggung Jawab',                                         'Nama Apoteker Penanggung Jawab (APJ)'),
('default_service_level', '95',                                                                 'Service level default untuk kalkulasi Safety Stock (%) — Z = 1.65'),
('default_lead_time',     '3',                                                                  'Lead time default jika belum diisi per obat (hari)'),
('default_biaya_pesan',   '0',                                                                  'Biaya pemesanan default per order (Rp) — 0 karena tidak ada biaya pengiriman'),
('threshold_expired_hari','90',                                                                  'Peringatan kedaluarsa: berapa hari sebelum expired untuk diberi peringatan')
ON CONFLICT (key) DO UPDATE SET
    value      = EXCLUDED.value,
    deskripsi  = EXCLUDED.deskripsi,
    updated_at = NOW();
