# Penjelasan Mendalam Rumus EOQ & ROP — SIMO

Dokumen ini menjawab pertanyaan "**mengapa**" di balik setiap rumus, bukan sekadar menampilkan rumusnya.
Cocok sebagai bahan landasan teori skripsi.

---

## Daftar Isi

1. [Standar Deviasi (σ)](#1-standar-deviasi-σ)
2. [EOQ — mengapa ada angka 2?](#2-economic-order-quantity-eoq)
3. [Total Cost (TC) — mengapa Q/2?](#3-total-biaya-persediaan-tc)
4. [Safety Stock — stok aman atau stok pengaman?](#4-safety-stock-ss)
5. [Service Level — mengapa 95%?](#5-service-level--z-score)
6. [Reorder Point (ROP) — kapan harus pesan?](#6-reorder-point-rop)
7. [Ringkasan Hubungan Antar Rumus](#7-ringkasan-hubungan-antar-rumus)

---

## 1. Standar Deviasi (σ)

### Fungsi utama: mengukur seberapa "liar" penjualan harian

Sebelum masuk rumus, pahami dulu **untuk apa** σ dipakai.

σ digunakan **hanya untuk satu hal** dalam sistem ini: menentukan besar safety stock.
Rumusnya: `SS = Z × σ × √LT`. Semakin besar σ, semakin besar safety stock yang dibutuhkan.

**Kenapa demikian?** Karena σ mengukur ketidakpastian permintaan harian. Kalau penjualan
tidak bisa diprediksi (naik-turun ekstrem), apotek butuh cadangan lebih banyak supaya tidak kehabisan.

### Intuisi: dua apotek dengan rata-rata yang sama

```
Apotek A — penjualan tiap hari selama 5 hari:
  10, 10, 10, 10, 10  → rata-rata = 10,  σ = 0
  (sangat stabil, mudah diprediksi)

Apotek B — penjualan tiap hari selama 5 hari:
   2, 18,  5, 20,  5  → rata-rata = 10,  σ = 8
  (sangat liar, susah diprediksi)
```

Kedua apotek rata-rata jual 10/hari — tapi Apotek B butuh safety stock jauh lebih besar
karena ada hari penjualan bisa tiba-tiba 20 (2× rata-rata).

**Kesimpulan mudah:** σ = "seberapa jauh penjualan harian bisa menyimpang dari rata-ratanya."
σ = 0 berarti penjualan selalu tepat sama dengan rata-rata. σ besar berarti fluktuatif.

### Rumus

```
σ = √( Σ(xᵢ - x̄)² / (n - 1) )
```

| Simbol | Arti |
|--------|------|
| xᵢ | penjualan hari ke-i |
| x̄ | rata-rata penjualan harian (D_harian) |
| n | jumlah hari data (= 30) |
| n-1 | pembagi "Bessel's correction" (lihat bawah) |

### Langkah-langkah manual

Misalnya data 5 hari Apotek B: `[2, 18, 5, 20, 5]`

1. **Hitung rata-rata:**
   ```
   x̄ = (2 + 18 + 5 + 20 + 5) / 5 = 50 / 5 = 10
   ```

2. **Hitung selisih tiap hari dari rata-rata, lalu kuadratkan:**
   ```
   (2-10)²  = 64
   (18-10)² = 64
   (5-10)²  = 25
   (20-10)² = 100
   (5-10)²  = 25
   ```
   Mengapa dikuadratkan? Agar selisih negatif dan positif tidak saling meniadakan.
   Kalau langsung dijumlah: (-8) + 8 + (-5) + 10 + (-5) = 0 — seolah tidak ada variasi padahal jelas ada.

3. **Jumlahkan lalu bagi (n-1):**
   ```
   Σ = 64 + 64 + 25 + 100 + 25 = 278
   Varians = 278 / (5-1) = 69,5
   ```

4. **Akar kuadrat — kembalikan ke satuan asli (unit/hari):**
   ```
   σ = √69,5 ≈ 8,34 unit/hari
   ```

Artinya: penjualan harian Apotek B rata-rata menyimpang ±8 unit dari nilai rata-ratanya.

### Mengapa dibagi (n-1), bukan n?

Data 30 hari adalah **sampel** dari pola penjualan sepanjang tahun. Sampel cenderung
meremehkan variasi sesungguhnya. Membagi dengan `n-1` (Bessel's correction) mengkoreksi
bias ini. Jika punya data seluruh tahun (365 hari), barulah dibagi n.

Untuk keperluan skripsi: cukup sebut "menggunakan standar deviasi sampel dengan pembagi n-1."

### Efek σ terhadap safety stock

```
Obat A: σ = 2 unit/hari, Z = 1,65, LT = 3 hari
  SS = 1,65 × 2 × √3 = 5,7 ≈ 6 unit

Obat B: σ = 8 unit/hari, Z = 1,65, LT = 3 hari
  SS = 1,65 × 8 × √3 = 22,9 ≈ 23 unit
```

Obat B butuh safety stock ~4× lebih besar hanya karena penjualannya lebih fluktuatif.

---

## 2. Economic Order Quantity (EOQ)

### Rumus

```
EOQ = √(2 × D × S / H)
```

### Dari mana angka **2** itu?

Angka 2 berasal dari **sifat matematika titik optimal**: di titik biaya terendah,
biaya pesan selalu **sama besar** dengan biaya simpan. Ini bisa dibuktikan, dan fakta
inilah yang digunakan untuk mencari rumus EOQ.

**Cara paling mudah memahaminya:**

Karena di titik optimal `biaya pesan = biaya simpan`, kita bisa tulis:

```
D/Q × S  =  Q/2 × H
─────────    ────────
biaya        biaya
pesan        simpan
```

Sekarang selesaikan persamaan ini untuk Q (4 langkah aljabar sederhana):

```
Langkah 1 — kalikan dua sisi dengan Q:
  D × S  =  Q²/2 × H

Langkah 2 — kalikan dua sisi dengan 2  (untuk hilangkan /2 di kanan):
  2 × D × S  =  Q² × H

Langkah 3 — bagi dua sisi dengan H:
  Q²  =  2 × D × S / H

Langkah 4 — akar kuadrat:
  Q   =  √(2 × D × S / H)
```

**Si angka 2 itu dari mana?** Dari `Q/2` di rumus biaya simpan. Ketika kita pindahkan
`/2` ke sisi kiri, ia menjadi `×2`. Itu saja — bukan konstanta magis.

**Kalau rata-rata stok bukan Q/2 tapi Q/3, apakah EOQ berubah?**
Ya! Rumusnya jadi `√(3DS/H)`. Angka 2 bisa berbeda kalau asumsi modelnya berbeda.
Tapi model EOQ klasik mengasumsikan rata-rata stok = Q/2 (penjelasan di bagian 3),
sehingga hasilnya selalu `√(2DS/H)`.

### Makna praktis EOQ

EOQ = jumlah pesanan yang **menyeimbangkan** dua biaya berlawanan:
- Semakin besar order → biaya simpan naik, biaya pesan turun
- Semakin kecil order → biaya simpan turun, biaya pesan naik
- EOQ = titik tengah optimal keduanya

```
Biaya ($)
    |  Biaya simpan (naik seiring Q)
    |         /
    |        /
    |   TC  /___________
    |      /            \
    |     /              \
    |____/________________\____
    |                      \
    |   Biaya pesan         \
    |   (turun seiring Q)    \
    +-----------------------------→ Q
                         ↑
                        EOQ
```

---

## 3. Total Biaya Persediaan (TC)

### Rumus

```
TC = (D/Q × S)  +  (Q/2 × H)
      ─────────     ──────────
      biaya pesan   biaya simpan
```

### Mengapa komponen biaya simpan = Q/2, bukan Q?

Ini adalah asumsi inti model EOQ: **pola pergerakan stok berbentuk gergaji (sawtooth)**.

```
Stok
 Q ┤ ┐         ┐         ┐
   │  \         \         \
   │   \         \         \
   │    \         \         \
 0 ┤     └─────────└─────────└──→ waktu
   │   <──LT──>
   │   pesan    terima
```

Asumsi model:
1. Stok **langsung penuh** saat order tiba (sejumlah Q)
2. Stok **habis tepat nol** saat order berikutnya tiba
3. Penurunan stok **konstan** (demand stabil)

Dengan asumsi ini, rata-rata stok yang disimpan = (Q + 0) / 2 = **Q/2**

Biaya simpan per tahun = rata-rata stok × biaya simpan per unit = **Q/2 × H**

### Mengapa komponen biaya pesan = D/Q × S?

`D/Q` = berapa kali pesan dalam setahun.
Misal D = 1.200 unit/tahun, Q = 100 unit → pesan 12 kali/tahun.
Biaya pesan total = 12 × S.

### Contoh numerik

```
D = 1.200 unit/tahun
S = Rp 10.000 / order
H = Rp 500 / unit / tahun
EOQ = √(2 × 1200 × 10000 / 500) = √48.000 ≈ 219 unit

TC = (1200/219 × 10.000)  +  (219/2 × 500)
   = (5,48 × 10.000)      +  (109,5 × 500)
   = Rp 54.800             +  Rp 54.750
   = Rp 109.550 / tahun
```

Perhatikan: kedua komponen hampir sama besar. Itu ciri khas titik optimal EOQ.

---

## 4. Safety Stock (SS)

### Apa itu Safety Stock sebenarnya?

**Safety Stock = stok pengaman = lapisan bawah dari stok yang tidak boleh terpakai dalam kondisi normal.**

SS bukan stok "aman" dalam arti stok yang cukup. SS adalah **cadangan darurat** yang disimpan
khusus untuk menghadapi dua situasi tak terduga:
1. Permintaan tiba-tiba melonjak melebihi prediksi
2. Supplier terlambat kirim (lead time molor)

### Apakah SS terpisah dari stok fisik di rak?

**TIDAK.** SS adalah bagian dari stok fisik yang ada di rak — bukan di lemari terpisah,
bukan di catatan terpisah. SS adalah **lapisan terbawah** dari stok yang dihitung sistem.

Bayangkan stok seperti botol minuman berlapis dua warna:

```
┌─────────────────────┐
│                     │  ← stok kerja (habis dan diisi ulang setiap siklus EOQ)
│   85 unit (kerja)   │
│                     │
├─────────────────────┤  ← garis batas SS (hanya ada di sistem, tidak kelihatan di rak)
│                     │  ← SAFETY STOCK
│   15 unit (SS)      │  ← cadangan darurat, tidak disentuh kondisi normal
│                     │
└─────────────────────┘

Total stok fisik di rak = 100 unit (SS sudah TERMASUK di dalamnya)
```

### Apa yang terjadi saat stok turun ke level SS?

Ini kondisi **kritis** — artinya semua buffer sudah habis terpakai. Situasi ini
idealnya tidak terjadi kalau ROP dipasang dengan benar.

```
Kondisi normal:
  Stok = 100 → turun perlahan → mencapai ROP = 45 → PESAN
  Selama tunggu kiriman (LT), pakai stok normal
  Saat barang tiba: stok tersisa = 15 (= tepat SS)
  Barang datang → stok kembali penuh

Kondisi darurat (demand melonjak saat tunggu kiriman):
  Stok = 45 → pakai lebih dari prediksi → stok = 8 saat barang tiba
  SS = 15, jadi sudah terpakai sebagian → sistem beri warning
  Apotek masih bisa melayani (belum 0), tapi tipis
```

### Posisi SS dalam grafik siklus stok

```
Stok
  Q+SS ┤ ┐           ┐           ┐
       │  \           \           \
   ROP ┤....\....pesan \....pesan  \   ← di sini order dibuat
       │     \         \           \
    SS ┤──────\─────────\───────────\── garis SS (lapisan dasar)
       │       \         \           \
     0 ┤        └─────────└───────────└──→ waktu
              LT         LT          LT
```

Dalam kondisi normal, stok tidak pernah menyentuh garis SS. SS adalah jaring pengaman.

### Rumus

```
SS = Z × σ × √LT
```

| Simbol | Arti | Contoh |
|--------|------|--------|
| Z | Z-score dari service level | 1,65 untuk 95% |
| σ | standar deviasi permintaan harian | 4,5 unit/hari |
| √LT | akar kuadrat lead time | √3 ≈ 1,732 untuk LT = 3 hari |

### Mengapa σ dikali √LT, bukan LT langsung?

Ketidakpastian demand **tidak bertambah secara linear** — ia bertambah secara **akar kuadrat**.

Analogi: Kalau tiap hari kamu bisa menyimpang ±5 langkah dari rute lurus, setelah 4 hari
kamu tidak menyimpang 4×5=20 langkah — tapi sekitar √4 × 5 = 10 langkah.
Karena penyimpangan bisa ke kanan atau ke kiri, sebagian saling mengimbangi.

Secara matematis: varians selama LT hari = LT × σ², jadi standar deviasinya = σ × √LT.

### Contoh hitungan SS

```
Z  = 1,65  (service level 95%)
σ  = 4,5   unit/hari
LT = 3     hari

SS = 1,65 × 4,5 × √3
   = 1,65 × 4,5 × 1,732
   = 12,86 ≈ 13 unit
```

Artinya: simpan 13 unit sebagai lapisan terbawah stok yang tidak boleh terpakai secara normal.

### Hubungan SS dengan EOQ dan ROP

SS **tidak masuk ke EOQ** — EOQ menghitung jumlah pesan optimal, tidak peduli SS.
SS **masuk ke ROP** — karena ROP harus menjamin stok bertahan sampai kiriman tiba + ada buffer SS.

```
EOQ  →  berapa yang dipesan sekali order
ROP  →  kapan harus pesan (termasuk buffer SS)
SS   →  seberapa besar buffer daruratnya
```

---

## 5. Service Level & Z-Score

### Apa itu Service Level?

Service Level adalah **probabilitas** bahwa apotek mampu memenuhi semua permintaan
**selama periode lead time** tanpa kehabisan stok.

```
Service Level 95%  =  95% kemungkinan TIDAK terjadi stockout per siklus pemesanan
                   =   5% kemungkinan terjadi stockout per siklus
```

### Dari mana Z-score berasal?

Z-score diambil dari **tabel distribusi normal standar** (kurva lonceng).
Ini mengasumsikan bahwa variasi demand mengikuti distribusi normal.

```
Distribusi Normal
         ↑
    95%  │       ████████████████████
  luas   │   ████████████████████████████
  kurva  │ ████████████████████████████████
         │████████████████████████████████████
         +─────────────────────────────────────→
                              ↑
                           Z = 1,65
                    (95% area di sebelah kiri)
```

| Service Level | Z-score | Artinya |
|--------------|---------|---------|
| 90% | 1,28 | Toleransi 10% stockout per siklus |
| 95% | 1,65 | Toleransi 5% stockout per siklus |
| 97% | 1,88 | Toleransi 3% stockout per siklus |
| 99% | 2,33 | Toleransi 1% stockout per siklus |

### Mengapa default 95%?

95% adalah standar yang umum digunakan di manajemen farmasi karena:
- Cukup tinggi untuk obat-obatan esensial (kehabisan bisa merugikan pasien)
- Tidak terlalu tinggi sehingga safety stock tidak membengkak berlebihan
- 99% hanya dipakai untuk obat kritikal/emergency

Apotek bisa mengatur service level per obat sesuai kebutuhan.

### Di mana Service Level digunakan dalam sistem?

Service Level **hanya digunakan untuk menghitung Safety Stock** — via Z-score.
Ia tidak masuk ke rumus EOQ, ROP (secara langsung), atau TC.

```
Service Level → Z-score → Safety Stock (SS)
                               ↓
                    ROP = D_harian × LT + SS
```

ROP "merasakan" efek service level secara tidak langsung melalui SS.

### Trade-off Service Level

```
Service Level naik  →  Z naik  →  SS lebih besar  →  stok lebih banyak  →  biaya simpan naik
Service Level turun →  Z turun →  SS lebih kecil  →  risiko stockout naik
```

---

## 6. Reorder Point (ROP)

### Rumus

```
ROP = (D_harian × LT) + SS
       ────────────────   ──
       ekspektasi demand  buffer
       selama lead time
```

### Makna: Titik Pemesanan, Bukan Titik Habis

ROP menjawab pertanyaan: **"Pada stok berapa kita harus memesan?"**

Logikanya:
1. Saat stok turun ke angka ROP, langsung buat pesanan.
2. Antara saat pesan dan barang tiba, ada jeda waktu = lead time.
3. Selama lead time itu, apotek masih bisa melayani dari stok yang tersisa.
4. Stok yang tersisa saat order tiba idealnya = SS (buffer), tidak sampai 0.

### Contoh lengkap

```
D_harian = 10 unit/hari
LT       = 5  hari
SS       = 20 unit

ROP = (10 × 5) + 20
    = 50 + 20
    = 70 unit

Artinya: saat stok tersisa 70 unit, segera pesan.
Selama 5 hari menunggu kiriman, apotek akan memakai ±50 unit.
Stok tersisa saat barang tiba = 70 - 50 = 20 (= tepat SS).
```

### Skenario jika demand melonjak saat menunggu kiriman

```
Stok saat pesan: 70 unit
Demand aktual 5 hari: 60 unit (bukan 50 seperti prediksi)

Stok saat barang tiba: 70 - 60 = 10 unit
SS = 20, jadi masih di atas 0 tapi di bawah SS → warning stockout kritis
```

SS berfungsi sebagai buffer untuk situasi seperti ini.

---

## 7. Ringkasan Hubungan Antar Rumus

```
DATA HISTORIS (30 hari penjualan)
    │
    ├─→ D_harian (rata-rata)  ─────────────────────────────┐
    │                                                       │
    ├─→ σ (standar deviasi)   ──┐                           │
    │                           │                           │
    └─→ D_tahunan = D_harian×365                            │
              │                 │                           │
              │         SERVICE LEVEL → Z                   │
              │                 │                           │
              ▼                 ▼                           ▼
    ┌──────────────────┐  ┌────────────────────┐  ┌────────────────────┐
    │  EOQ             │  │  Safety Stock (SS) │  │  ROP               │
    │  √(2×D×S/H)      │  │  Z × σ × √LT       │  │  D_harian×LT + SS  │
    └────────┬─────────┘  └────────────────────┘  └────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │  TC              │
    │  D/Q×S + Q/2×H   │
    └──────────────────┘
```

### Tabel ringkasan simbol

| Simbol | Nama Lengkap | Satuan | Sumber |
|--------|-------------|--------|--------|
| D | Demand tahunan | unit/tahun | D_harian × 365 |
| D_harian | Rata-rata penjualan harian | unit/hari | Rata-rata 30 hari |
| S | Biaya pemesanan per order | Rp/order | Input manual |
| H | Biaya simpan per unit per tahun | Rp/unit/tahun | Input manual |
| LT | Lead time | hari | Input manual |
| σ | Standar deviasi demand harian | unit/hari | Dihitung dari data 30 hari |
| Z | Z-score | - | Lookup dari service level |
| Q | Jumlah order (= EOQ saat optimal) | unit | Hasil hitung EOQ |
| SS | Safety Stock | unit | Z × σ × √LT |
| ROP | Reorder Point | unit | D_harian × LT + SS |
| TC | Total biaya siklus per tahun | Rp/tahun | D/Q×S + Q/2×H |

---

## Catatan untuk Skripsi

- **EOQ** mengasumsikan demand konstan dan deterministik. Dalam praktik apotek, demand berfluktuasi — itulah mengapa safety stock diperlukan.
- **Safety Stock** mengatasi asumsi ideal EOQ. Ia adalah jembatan antara model teoritis dan realita operasional.
- **Service Level** adalah keputusan manajerial, bukan hasil hitung. Apotek memilih berapa toleransi risiko yang bisa diterima.
- **TC yang ditampilkan** adalah biaya siklus (cycle cost), bukan total biaya lengkap. Safety stock tidak dimasukkan ke TC karena merupakan biaya tetap yang tidak mempengaruhi nilai EOQ optimal.

Lihat [06-business-logic.md](06-business-logic.md) untuk implementasi kode dan kasus khusus (S = 0).
