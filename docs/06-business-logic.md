# Business Logic & Kalkulasi — SIMO

Dokumen ini adalah referensi utama untuk implementasi semua rumus dan aturan bisnis.
Seluruh kalkulasi diimplementasikan di `backend/src/services/eoqService.js`.

---

## 1. Parameter Input

| Simbol | Nama | Sumber | Satuan |
|---|---|---|---|
| D | Permintaan per tahun | Dihitung dari barang keluar (Penjualan) 30 hari × 365/30 | unit/tahun |
| S | Biaya pemesanan per order | Input manual per obat | Rp |
| H | Biaya penyimpanan per unit per tahun | Input manual per obat | Rp/unit/tahun |
| LT | Lead time | Input manual per obat atau default sistem | hari |
| Z | Z-score service level | Lookup dari service level (%) | - |
| σ | Standar deviasi permintaan harian | Dihitung dari data 30 hari | unit |

---

## 2. Menghitung Demand (D dan σ)

### Langkah 1 — Ambil data barang keluar 30 hari terakhir (hanya keterangan = 'Penjualan')

```sql
SELECT tanggal, SUM(jumlah) as total
FROM barang_keluar
WHERE obat_id = $1
  AND keterangan = 'Penjualan'
  AND tanggal >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tanggal
ORDER BY tanggal
```

Hasilnya: array harian, misalnya:
```
[5, 0, 8, 3, 0, 0, 7, 4, 2, 0, ...]  ← 30 elemen, 0 jika tidak ada penjualan hari itu
```

### Langkah 2 — Hitung rata-rata harian (D_harian)

```
D_harian = total_penjualan_30_hari / 30
```

### Langkah 3 — Hitung standar deviasi (σ)

```
σ = √( Σ(xi - D_harian)² / (n-1) )
```
Dimana `xi` = penjualan hari ke-i, `n` = 30.

### Langkah 4 — Hitung demand tahunan (D)

```
D = D_harian × 365
```

> **Catatan penting:** Jika belum ada data penjualan 30 hari (obat baru), gunakan stok awal sebagai estimasi D, dan σ = 0. Tampilkan warning di UI.

---

## 3. Economic Order Quantity (EOQ)

### Rumus

```
EOQ = √(2 × D × S / H)
```

### Implementasi JS (`eoqService.js`)

```js
function hitungEoq(D, S, H) {
  if (H <= 0) return 0;
  if (S <= 0) return 0; // EOQ = 0 jika tidak ada biaya pesan
  return Math.sqrt((2 * D * S) / H);
}
```

### Kasus Khusus Apotek Rezky Medika

Apotek ini memiliki **biaya pemesanan S = 0** (tidak ada biaya pengiriman, langsung ambil ke supplier). Dalam kondisi ini:
- EOQ secara matematis = 0
- **Solusi:** Sistem tetap menampilkan hasil kalkulasi EOQ = 0 dan memberikan rekomendasi: *"Karena biaya pesan = 0, pesan dalam jumlah EOQ tidak berlaku. Gunakan ROP sebagai trigger pemesanan, dan pesan sejumlah satu batch (X dus) per order."*
- Safety Stock dan ROP tetap dihitung normal

---

## 4. Safety Stock (SS)

### Rumus

```
SS = Z × σ × √LT
```

### Nilai Z berdasarkan Service Level

| Service Level | Z |
|---|---|
| 90% | 1.28 |
| 95% | 1.65 |
| 97% | 1.88 |
| 99% | 2.33 |

### Implementasi JS

```js
function getZScore(serviceLevel) {
  if (serviceLevel >= 99) return 2.33;
  if (serviceLevel >= 97) return 1.88;
  if (serviceLevel >= 95) return 1.65;
  return 1.28;
}

function hitungSafetyStock(Z, sigma, leadTime) {
  return Z * sigma * Math.sqrt(leadTime);
}
```

---

## 5. Reorder Point (ROP)

### Rumus

```
ROP = (D_harian × LT) + SS
```

### Implementasi JS

```js
function hitungRop(demandHarian, leadTime, safetyStock) {
  return (demandHarian * leadTime) + safetyStock;
}
```

---

## 6. Total Biaya Persediaan (TC)

### Rumus

```
TC = (D/Q × S) + (Q/2 × H)
```

Dimana Q = EOQ.

Komponen:
- `D/Q × S` = biaya pemesanan per tahun (frekuensi × biaya per order)
- `Q/2 × H` = biaya penyimpanan per tahun (rata-rata stok × biaya simpan)

### Implementasi JS

```js
function hitungTotalBiaya(D, Q, S, H) {
  if (Q <= 0) return 0;
  const biayaPemesanan = (D / Q) * S;
  const biayaPenyimpanan = (Q / 2) * H;
  return biayaPemesanan + biayaPenyimpanan;
}
```

---

## 7. Status Stok

### Aturan Klasifikasi

```js
function getStatusStok(stok, rop) {
  if (stok <= rop) return 'HARUS_REORDER';        // stok ≤ ROP
  if (stok <= rop * 1.2) return 'MENDEKATI_ROP';  // stok antara ROP dan ROP × 1.2
  return 'AMAN';                                   // stok > ROP × 1.2
}
```

---

## 8. Estimasi Stok Habis

```js
function getEstimasiHabisHari(stok, demandHarian) {
  if (demandHarian <= 0) return null;
  return Math.ceil(stok / demandHarian);
}
```

---

## 9. Trigger Kalkulasi Ulang

Kalkulasi ulang EOQ, SS, ROP, TC dipicu oleh `stokService.js` dalam kondisi:

1. **POST barang-keluar** → demand bisa berubah
2. **POST barang-masuk** → tidak perlu kalkulasi ulang (stok bertambah, demand tidak berubah)
3. **PUT obat/:id** → parameter H, S, LT, service_level berubah
4. **POST obat/:id/hitung-ulang** → manual trigger

### Alur kalkulasi ulang di `stokService.js`

```js
async function hitungUlangObat(obatId, pool) {
  // 1. Ambil data penjualan 30 hari terakhir
  const dataPenjualan = await demandService.getDemandHarian(obatId, pool);

  // 2. Hitung demand & std dev
  const demandHarian = dataPenjualan.reduce((a, b) => a + b, 0) / 30;
  const stdDev = demandService.hitungStdDev(dataPenjualan, demandHarian);
  const demandTahunan = demandHarian * 365;

  // 3. Ambil data obat
  const { rows } = await pool.query('SELECT * FROM obat WHERE id = $1', [obatId]);
  const obat = rows[0];

  // 4. Hitung EOQ, SS, ROP, TC
  const Z = eoqService.getZScore(obat.service_level);
  const eoq = eoqService.hitungEoq(demandTahunan, obat.biaya_pesan, obat.biaya_simpan);
  const ss  = eoqService.hitungSafetyStock(Z, stdDev, obat.lead_time);
  const rop = eoqService.hitungRop(demandHarian, obat.lead_time, ss);
  const tc  = eoqService.hitungTotalBiaya(demandTahunan, eoq, obat.biaya_pesan, obat.biaya_simpan);

  // 5. Simpan ke tabel obat
  await pool.query(
    `UPDATE obat SET
      demand_harian = $1, std_dev_demand = $2, demand_tahunan = $3,
      eoq = $4, safety_stock = $5, rop = $6, total_biaya = $7,
      status_stok = $8, updated_at = NOW()
    WHERE id = $9`,
    [demandHarian, stdDev, demandTahunan, eoq, ss, rop, tc,
     eoqService.getStatusStok(obat.stok, rop), obatId]
  );
}
```

---

## 10. Simulasi Skenario

Simulasi menggunakan parameter yang dimodifikasi, **tanpa mengubah data aktual**.

```js
async function jalankanSimulasi(obat, params) {
  // Nilai aktual
  const aktual = {
    demand_tahunan: obat.demand_tahunan,
    eoq:            obat.eoq,
    safety_stock:   obat.safety_stock,
    rop:            obat.rop,
    total_biaya:    obat.total_biaya,
  };

  // Parameter simulasi
  const D_sim = params.demand_perubahan_pct != null
    ? obat.demand_tahunan * (1 + params.demand_perubahan_pct / 100)
    : (params.demand_nilai_baru ?? obat.demand_tahunan);

  const LT_sim = params.lead_time_baru  ?? obat.lead_time;
  const H_sim  = params.biaya_simpan_baru ?? obat.biaya_simpan;
  const S_sim  = params.biaya_pesan_baru  ?? obat.biaya_pesan;
  const demandHarian_sim = D_sim / 365;

  const Z = getZScore(obat.service_level);
  const eoq_sim = hitungEoq(D_sim, S_sim, H_sim);
  const ss_sim  = hitungSafetyStock(Z, obat.std_dev_demand, LT_sim);
  const rop_sim = hitungRop(demandHarian_sim, LT_sim, ss_sim);
  const tc_sim  = hitungTotalBiaya(D_sim, eoq_sim, S_sim, H_sim);

  const simulasi = { demand_tahunan: D_sim, eoq: eoq_sim, safety_stock: ss_sim, rop: rop_sim, total_biaya: tc_sim };

  const pctChange = (a, b) => a === 0 ? 0 : ((b - a) / a) * 100;

  return {
    nilai_sekarang: aktual,
    nilai_simulasi: simulasi,
    selisih: {
      demand_tahunan_pct: pctChange(aktual.demand_tahunan, D_sim),
      eoq_unit:           eoq_sim - aktual.eoq,
      safety_stock_unit:  ss_sim  - aktual.safety_stock,
      rop_unit:           rop_sim - aktual.rop,
      total_biaya_rp:     tc_sim  - aktual.total_biaya,
    },
  };
}
```

---

## 11. Konversi Satuan Dus → Satuan Terkecil

```js
// Di barangMasukController.js
const jumlahSatuan = req.body.jumlah_dus * obat.satuan_per_dus;
```

Contoh: obat dengan `satuan_per_dus = 100` (1 dus = 100 tablet)
- Input: 5 dus
- Konversi: 5 × 100 = 500 tablet

---

## 12. Batasan Model

### TC Menggunakan Q/2 Tanpa Safety Stock

Rumus TC yang diimplementasikan menggunakan model EOQ klasik:

```
TC = (D/Q × S) + (Q/2 × H)
```

Komponen biaya simpan `Q/2 × H` menghitung rata-rata **siklus stok** saja, tanpa memasukkan safety stock. Secara teknis, rata-rata stok aktual yang ditahan adalah `Q/2 + SS`, sehingga biaya simpan yang lebih akurat seharusnya:

```
Biaya simpan aktual = (Q/2 + SS) × H
```

**Alasan tidak dimasukkan:**
Safety stock (`SS × H`) adalah biaya tetap — nilainya tidak berubah terhadap Q, sehingga tidak mempengaruhi nilai EOQ optimal hasil optimasi. Untuk keperluan perbandingan TC sebelum vs sesudah EOQ, komponen ini konsisten di kedua sisi sehingga tidak mengubah selisih/penghematan.

**Implikasi untuk skripsi:**
Nilai TC yang ditampilkan di halaman Analisis Komparatif merepresentasikan **biaya siklus** (cycle cost), bukan biaya total persediaan secara keseluruhan. Ini adalah pendekatan yang umum digunakan pada model EOQ deterministik (Heizer & Render; Tersine).

> Dokumentasikan sebagai batasan penelitian: *"Perhitungan TC menggunakan model EOQ klasik dengan komponen biaya simpan Q/2 × H. Safety stock tidak dimasukkan ke dalam TC karena merupakan biaya tetap yang tidak mempengaruhi optimasi EOQ, melainkan digunakan sebagai dasar perhitungan ROP."*

---

## 13. Format Tampilan Step-by-Step (untuk Skripsi)

Format yang harus ditampilkan di halaman Perhitungan & Laporan EOQ-ROP:

```
==============================
PERHITUNGAN EOQ
Obat: Paracetamol 500mg
==============================

Data Input:
  D  = 1.200 unit/tahun
  S  = Rp 0 / order
  H  = Rp 250 / unit / tahun

Rumus:
  EOQ = √(2 × D × S / H)

Substitusi:
  EOQ = √(2 × 1.200 × 0 / 250)
  EOQ = √(0)
  EOQ = 0

Keterangan: Biaya pesan (S) = 0, maka EOQ = 0.
Rekomendasi: Pesan 1 batch per order saat ROP tercapai.

==============================
PERHITUNGAN SAFETY STOCK
==============================

Data Input:
  Z   = 1,65  (service level 95%)
  σ   = 4,50  unit/hari
  LT  = 3     hari

Rumus:
  SS = Z × σ × √LT

Substitusi:
  SS = 1,65 × 4,50 × √3
  SS = 1,65 × 4,50 × 1,732
  SS = 12,86 ≈ 13 unit

==============================
PERHITUNGAN REORDER POINT
==============================

Data Input:
  D_harian = 3,29  unit/hari
  LT       = 3     hari
  SS       = 13    unit

Rumus:
  ROP = (D_harian × LT) + SS

Substitusi:
  ROP = (3,29 × 3) + 13
  ROP = 9,86 + 13
  ROP = 22,86 ≈ 23 unit
```

Komponen `RumusDisplay.tsx` di frontend merender format ini dari data yang dikembalikan endpoint `GET /api/obat/:id/perhitungan`.
