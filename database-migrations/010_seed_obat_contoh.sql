-- Seed 010: Data supplier dan obat contoh untuk testing
-- Data dibuat realistis sesuai kondisi apotek UMKM

-- ============================================================
-- SUPPLIER
-- ============================================================
INSERT INTO supplier (nama, alamat, telepon, whatsapp, jenis_obat, lead_time_avg) VALUES
(
    'PBF Kimia Farma',
    'Jl. Raya Manokwari, Papua Barat',
    '0986-211234',
    '081234560001',
    'Obat generik, vitamin, suplemen',
    3
),
(
    'PBF Indo Farma',
    'Jl. Pasar Baru, Manokwari, Papua Barat',
    '0986-215678',
    '081234560002',
    'Antibiotik, analgesik, antasida',
    4
),
(
    'PBF Kalbe Farma',
    'Jl. Yos Sudarso, Manokwari, Papua Barat',
    '0986-219012',
    '081234560003',
    'Vitamin, suplemen, OTC',
    3
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- OBAT CONTOH (10 obat dengan parameter realistis)
-- Stok awal, biaya_simpan ~20% dari harga beli per tahun
-- biaya_pesan = 0 (sesuai kondisi apotek Rezky Medika)
-- demand_harian, std_dev, demand_tahunan, eoq, safety_stock, rop, total_biaya
-- dihitung manual dan dimasukkan sebagai seed awal
-- (akan di-update otomatis oleh sistem setelah ada transaksi)
-- ============================================================

-- Format kode: OBT-001 s.d. OBT-010
-- Satuan: tablet kecuali disebutkan lain
-- satuan_per_dus: 1 dus = satuan terkecil sesuai kemasan

INSERT INTO obat (
    kode, nama, kategori, satuan, satuan_per_dus,
    harga_beli, stok,
    biaya_pesan, biaya_simpan, lead_time, service_level,
    demand_harian, std_dev_demand, demand_tahunan,
    eoq, safety_stock, rop, total_biaya,
    expired_terdekat, supplier_id, nama_supplier
) VALUES

-- 1. Paracetamol 500mg
(
    'OBT-001', 'Paracetamol 500mg', 'Analgesik', 'tablet', 100,
    500, 1200,
    0, 100, 3, 95,
    10.96, 3.20, 4000,
    0, 8.62, 41.50, 0,
    '2027-06-30', 1, 'PBF Kimia Farma'
),

-- 2. Amoxicillin 500mg
(
    'OBT-002', 'Amoxicillin 500mg', 'Antibiotik', 'kapsul', 100,
    1200, 600,
    0, 240, 4, 95,
    4.93, 1.85, 1800,
    0, 7.07, 26.79, 0,
    '2027-03-31', 2, 'PBF Indo Farma'
),

-- 3. Antasida Doen
(
    'OBT-003', 'Antasida Doen', 'Antasida', 'tablet', 100,
    350, 800,
    0, 70, 3, 95,
    6.85, 2.10, 2500,
    0, 5.66, 26.22, 0,
    '2026-12-31', 2, 'PBF Indo Farma'
),

-- 4. Vitamin C 500mg
(
    'OBT-004', 'Vitamin C 500mg', 'Vitamin', 'tablet', 100,
    800, 1500,
    0, 160, 3, 95,
    13.70, 4.50, 5000,
    0, 12.14, 53.24, 0,
    '2027-09-30', 3, 'PBF Kalbe Farma'
),

-- 5. Ibuprofen 400mg
(
    'OBT-005', 'Ibuprofen 400mg', 'Analgesik', 'tablet', 100,
    900, 500,
    0, 180, 3, 95,
    5.48, 1.95, 2000,
    0, 5.26, 21.70, 0,
    '2027-04-30', 1, 'PBF Kimia Farma'
),

-- 6. CTM (Chlorpheniramine Maleat) 4mg
(
    'OBT-006', 'CTM 4mg', 'Antihistamin', 'tablet', 100,
    300, 400,
    0, 60, 3, 95,
    3.29, 1.20, 1200,
    0, 3.24, 13.10, 0,
    '2027-01-31', 1, 'PBF Kimia Farma'
),

-- 7. Metronidazole 500mg
(
    'OBT-007', 'Metronidazole 500mg', 'Antibiotik', 'tablet', 100,
    1000, 300,
    0, 200, 4, 95,
    2.47, 0.95, 900,
    0, 3.63, 13.51, 0,
    '2027-02-28', 2, 'PBF Indo Farma'
),

-- 8. Omeprazole 20mg
(
    'OBT-008', 'Omeprazole 20mg', 'Antasida', 'kapsul', 30,
    2500, 150,
    0, 500, 4, 95,
    1.64, 0.72, 600,
    0, 2.75, 9.31, 0,
    '2027-05-31', 2, 'PBF Indo Farma'
),

-- 9. Cetirizine 10mg
(
    'OBT-009', 'Cetirizine 10mg', 'Antihistamin', 'tablet', 100,
    1500, 350,
    0, 300, 3, 95,
    2.74, 1.05, 1000,
    0, 2.83, 11.06, 0,
    '2027-08-31', 3, 'PBF Kalbe Farma'
),

-- 10. Vitamin B Complex
(
    'OBT-010', 'Vitamin B Complex', 'Vitamin', 'tablet', 100,
    600, 900,
    0, 120, 3, 95,
    8.22, 2.80, 3000,
    0, 7.55, 32.21, 0,
    '2027-07-31', 3, 'PBF Kalbe Farma'
)

ON CONFLICT (kode) DO NOTHING;
