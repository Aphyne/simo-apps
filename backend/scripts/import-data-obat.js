/**
 * Script sekali jalan: impor data master dari data_obat_aptl_Rezky.xlsx
 * (sheet "A. Data Obat & Stok" dan "B. Data Supplier") ke database.
 *
 * Mode default = DRY RUN: hanya mencetak laporan, tidak menulis apa pun.
 * Jalankan dengan --commit untuk benar-benar menulis ke database.
 *
 * Jalankan dari folder /backend:
 *   node scripts/import-data-obat.js                 (dry-run)
 *   node scripts/import-data-obat.js --commit         (tulis ke DB)
 *   node scripts/import-data-obat.js --file=path.xlsx --commit
 */

require('dotenv').config();
const path = require('path');
const ExcelJS = require('exceljs');
const pool = require('../src/db/pool');
const { kalkulasiLengkap } = require('../src/services/eoqService');
const { KATEGORI_OBAT, SATUAN_OBAT } = require('./lib/importConstants');

const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const fileArg = args.find((a) => a.startsWith('--file='));
const FILE_PATH = fileArg
  ? path.resolve(fileArg.slice('--file='.length))
  : path.join(__dirname, 'data', 'data_obat_aptl_Rezky.xlsx');

const SHEET_OBAT = 'A. Data Obat & Stok';
const SHEET_SUPPLIER = 'B. Data Supplier';
const OBAT_DATA_START_ROW = 6; // baris 2-5 adalah contoh/catatan (lihat sheet Panduan)
const SUPPLIER_DATA_START_ROW = 3; // baris 2 adalah contoh

// Default EOQ/ROP untuk obat hasil impor (sesuai arahan):
const DEFAULT_LEAD_TIME = 1;
const DEFAULT_BIAYA_PESAN = 0; // S = 0
const DEFAULT_BIAYA_SIMPAN_PCT = 20; // H = 20% dari harga beli, sama seperti form Stok Masuk
const DEFAULT_SERVICE_LEVEL = 95;

// Pemetaan nama supplier non-baku (seperti ditulis di sheet A) → nama baku (sheet B)
const SUPPLIER_ALIAS = {
  'pt aditya kf': 'PT Aditya Kimia Farma',
  'pt bades jf': 'PT Bades Jaya Farma',
  'pt jivaka medika': 'PT Jivaka Medika',
  'pt maiwa farma': 'PT Maiwa Farma',
};

// ─── Helpers: baca cell ───────────────────────────────────────────────────────

function cellValue(cell) {
  let v = cell.value;
  if (v && typeof v === 'object') {
    if (v.richText) v = v.richText.map((t) => t.text).join('');
    else if (v instanceof Date) return v;
    else if (v.result !== undefined) v = v.result;
    else return null;
  }
  return v;
}

function cellText(cell) {
  const v = cellValue(cell);
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

// ─── Helpers: pembersihan data ─────────────────────────────────────────────────

// "Rp. 72.000" / "Rp 2.500/sachet" / 72000 (number) → 72000
function parseRupiah(cell) {
  const raw = cellValue(cell);
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw);
  const match = s.match(/[\d.,]+/);
  if (!match) return null;
  // Hilangkan titik ribuan, lalu ambil angka. Format di file ini tidak pernah
  // pakai koma desimal, jadi koma juga dianggap pemisah ribuan kalau muncul.
  const cleaned = match[0].replace(/[.,]/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? null : n;
}

// "10 strip" / "1botol" / 3 (number) → 3 (ambil angka pertama, default 1 kalau kosong tapi ada teks satuan)
function parseQty(cell, fallback = null) {
  const raw = cellValue(cell);
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'number') return raw;
  const s = String(raw);
  const match = s.match(/[\d.]+/);
  if (!match) return fallback;
  const n = parseFloat(match[0]);
  return isNaN(n) ? fallback : n;
}

// Date object asli, "30-11-2028" (DD-MM-YYYY), "30-1-2029" (D-M-YYYY) → 'YYYY-MM-DD' atau null
function parseExpiredDate(cell) {
  const raw = cellValue(cell);
  if (raw === null || raw === undefined) return null;
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (!s) return null;
  // Terima pemisah "-" atau "/": "30-11-2028", "30/11/2028", "30-1-2029", dst
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const dd = String(d).padStart(2, '0');
    const mm = String(mo).padStart(2, '0');
    // validasi kasar: bulan 1-12, tanggal 1-31
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return undefined; // undefined = invalid, beda dari null = kosong
    return `${y}-${mm}-${dd}`;
  }
  // Coba parse langsung sebagai fallback (format lain yang belum terduga)
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  // Placeholder murni huruf tanpa digit ("XXXX", "XXXXX", dll) → jelas bukan usaha
  // menulis tanggal, perlakukan sebagai kosong (obat tetap masuk tanpa expired),
  // bukan invalid. Teks yang MENGANDUNG digit tapi tetap gagal diparse (typo
  // tanggal asli) tetap ditandai invalid supaya dicek manual.
  if (!/\d/.test(s)) return null;
  return undefined; // mengandung digit tapi tidak terbaca → invalid, perlu dicek manual
}

// No. Batch placeholder murni huruf tanpa digit ("XXXX", "XXXXX", "XXXXXXX") →
// jelas bukan No. Batch asli (No. Batch asli selalu punya digit), perlakukan
// sebagai kosong. Sama logikanya dengan placeholder tanggal expired di parseExpiredDate.
function cleanNoBatch(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (!/\d/.test(s)) return null;
  return s;
}

function titleCase(s) {
  return s
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Normalisasi kategori: cocokkan ke KATEGORI_OBAT baku (case-insensitive, toleransi
// typo umum via alias manual), sisanya masuk "Lainnya" supaya tetap muncul di filter UI.
// Pemetaan lengkap berdasarkan seluruh 79 variasi nilai mentah yang ada di
// data_obat_aptl_Rezky.xlsx (lihat hasil audit frekuensi kategori). Kategori yang
// jarang dipakai dan tidak punya padanan jelas (Antimalaria, Vertigo, dll) sengaja
// dipetakan ke "Lainnya" — hanya kategori dengan volume besar yang dijadikan baku.
const KATEGORI_ALIAS = {
  'lainnya': 'Lainnya',
  'ab': 'Antibiotik', 'sirup  ab': 'Antibiotik', 'antibiotik': 'Antibiotik',
  'analgesik': 'Analgesik', 'analgetik': 'Analgesik', 'anlgesik': 'Analgesik',
  'analgesik antipiretik': 'Analgesik', 'analgetik antipiretik': 'Analgesik',
  'sirup analgesik': 'Analgesik', 'demam': 'Analgesik',
  'antasida': 'Antasida', 'obat lambung': 'Antasida', 'sirup lambung': 'Antasida', 'ppi': 'Antasida',
  'antihistamin': 'Antihistamin', 'sirup antihistamin': 'Antihistamin',
  'vitamin': 'Vitamin',
  'multivitamin': 'Suplemen', 'suplemen': 'Suplemen', 'prebiotic': 'Suplemen', 'susu': 'Suplemen',
  'antidiabetic': 'Antidiabetik', 'antidiabetik': 'Antidiabetik',
  'antihipertensi': 'Antihipertensi', 'atihipertensi': 'Antihipertensi',
  'antijamur': 'Antijamur',
  'antidiare': 'Antidiare', 'diare': 'Antidiare', 'sirup diare': 'Antidiare',
  'nsaid': 'Antiinflamasi', 'antiinflamasi': 'Antiinflamasi',
  'flu batuk': 'Flu & Batuk', 'batuk flu': 'Flu & Batuk', 'flu': 'Flu & Batuk',
  'obat flu': 'Flu & Batuk', 'batuk': 'Flu & Batuk', 'sirup batuk': 'Flu & Batuk',
  'pelega tenggorokan': 'Flu & Batuk', 'dekongestan': 'Flu & Batuk',
  'mucolitik': 'Flu & Batuk', 'ekspectoran': 'Flu & Batuk', 'obat kumur': 'Flu & Batuk',
  'alkes': 'Alat Kesehatan',
  'salep': 'Salep', 'salep mata': 'Salep', 'salep bisul': 'Salep',
  'jamu': 'Jamu',
  'tetes mata': 'Tetes Mata & Telinga', 'tetes telinga': 'Tetes Mata & Telinga',
};

function normalizeKategori(raw) {
  if (!raw) return { value: 'Lainnya', changed: true, original: raw };
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase();
  if (KATEGORI_ALIAS[key]) {
    return { value: KATEGORI_ALIAS[key], changed: KATEGORI_ALIAS[key] !== trimmed, original: raw };
  }
  const bakuMatch = KATEGORI_OBAT.find((k) => k.toLowerCase() === key);
  if (bakuMatch) {
    return { value: bakuMatch, changed: bakuMatch !== trimmed, original: raw };
  }
  return { value: 'Lainnya', changed: true, original: raw };
}

// Normalisasi satuan: cocokkan ke SATUAN_OBAT baku (lowercase). Kalau tidak ada
// padanan baku, tetap simpan versi lowercase apa adanya (bukan "Lainnya" — satuan
// bebas teks, beda dari kategori yang dipakai sebagai filter dropdown tertutup).
function normalizeSatuan(raw) {
  if (!raw) return { value: null, changed: false, original: raw };
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const bakuMatch = SATUAN_OBAT.find((s) => s.toLowerCase() === lower);
  const value = bakuMatch || lower;
  return { value, changed: value !== trimmed, original: raw };
}

function normalizeSupplierName(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const alias = SUPPLIER_ALIAS[trimmed.toLowerCase()];
  return alias || trimmed;
}

// ─── Baca sheet Supplier ───────────────────────────────────────────────────────

function readSuppliers(workbook) {
  const ws = workbook.getWorksheet(SHEET_SUPPLIER);
  if (!ws) throw new Error(`Sheet "${SHEET_SUPPLIER}" tidak ditemukan`);

  const suppliers = [];
  for (let r = SUPPLIER_DATA_START_ROW; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const nama = cellText(row.getCell(2));
    if (!nama) continue;
    suppliers.push({
      row: r,
      nama,
      alamat: cellText(row.getCell(3)),
      telepon: cellText(row.getCell(4)),
      jenis_obat: cellText(row.getCell(5)),
    });
  }
  return suppliers;
}

// ─── Baca sheet Obat & Stok ─────────────────────────────────────────────────────

function readObatRows(workbook) {
  const ws = workbook.getWorksheet(SHEET_OBAT);
  if (!ws) throw new Error(`Sheet "${SHEET_OBAT}" tidak ditemukan`);

  const rows = [];
  for (let r = OBAT_DATA_START_ROW; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const nama = cellText(row.getCell(2));
    if (!nama) continue; // baris kosong / baris lanjutan multi-batch tanpa nama → dilewati (lihat catatan di bawah)

    const kategoriRaw = cellText(row.getCell(3));
    const satuanRaw = cellText(row.getCell(4));
    const isiPerSatuanPesan = parseQty(row.getCell(6), 1); // "Isi per Satuan Pesan" → satuan_per_dus
    const hargaBeli = parseRupiah(row.getCell(7));
    const hargaJual = parseRupiah(row.getCell(8));
    const supplierRaw = cellText(row.getCell(9));
    const noBatchRaw = cellValue(row.getCell(10));
    const jumlahBatch = parseQty(row.getCell(11), null);
    const noFaktur = cellText(row.getCell(12));
    const expiredParsed = parseExpiredDate(row.getCell(13));

    rows.push({
      row: r,
      nomorExcel: cellValue(row.getCell(1)),
      nama,
      kategoriRaw,
      satuanRaw,
      satuan_per_dus: isiPerSatuanPesan && isiPerSatuanPesan > 0 ? Math.round(isiPerSatuanPesan) : 1,
      harga_beli: hargaBeli,
      harga_jual: hargaJual,
      supplierRaw,
      no_batch: cleanNoBatch(noBatchRaw),
      jumlah_batch: jumlahBatch !== null ? Math.round(jumlahBatch) : null,
      no_faktur: noFaktur,
      expired_batch: expiredParsed, // string 'YYYY-MM-DD' | null (kosong) | undefined (invalid)
      expired_raw: cellValue(row.getCell(13)),
    });
  }
  return rows;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT (akan menulis ke database)' : 'DRY RUN (tidak menulis apa pun)'}`);
  console.log(`File: ${FILE_PATH}\n`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FILE_PATH);

  const supplierRows = readSuppliers(workbook);
  const obatRows = readObatRows(workbook);

  console.log(`Sheet "${SHEET_SUPPLIER}": ${supplierRows.length} supplier ditemukan.`);
  console.log(`Sheet "${SHEET_OBAT}": ${obatRows.length} baris data (setelah lewati contoh & baris kosong).\n`);

  const laporan = {
    supplierBaru: [],
    supplierDilewati: [], // sudah ada di DB
    obatMasuk: [],
    obatDiupdate: [], // nama sudah ada, field kosong di-backfill dari Excel
    obatDilewati: [], // nama sudah ada, tidak ada field kosong yang bisa dilengkapi
    bermasalah: [], // baris yang gagal divalidasi, dilewati dengan alasan
  };

  const client = await pool.connect();
  try {
    if (COMMIT) await client.query('BEGIN');

    // ── 1. Supplier: insert yang belum ada (case-insensitive by nama) ─────────
    const { rows: existingSuppliers } = await client.query('SELECT id, nama FROM supplier');
    const supplierByNameLower = new Map(existingSuppliers.map((s) => [s.nama.toLowerCase(), s]));

    for (const s of supplierRows) {
      const key = s.nama.toLowerCase();
      if (supplierByNameLower.has(key)) {
        laporan.supplierDilewati.push({ nama: s.nama, alasan: 'sudah ada di database' });
        continue;
      }
      if (COMMIT) {
        const { rows } = await client.query(
          `INSERT INTO supplier (nama, alamat, telepon, jenis_obat, lead_time_avg, biaya_pesan)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nama`,
          [s.nama, s.alamat, s.telepon, s.jenis_obat, DEFAULT_LEAD_TIME, 0]
        );
        supplierByNameLower.set(key, rows[0]);
      } else {
        // dry-run: supaya pemetaan obat→supplier tetap bisa disimulasikan
        supplierByNameLower.set(key, { id: null, nama: s.nama });
      }
      laporan.supplierBaru.push({ nama: s.nama, alamat: s.alamat, telepon: s.telepon });
    }

    // ── 2. Obat: insert baru (nama belum ada) ATAU backfill (nama sudah ada,
    // tapi field masih kosong/default — misal re-import file Excel yang sama
    // setelah dilengkapi harga/batch/supplier yang tadinya kosong). Field yang
    // di database SUDAH terisi nilai nyata (bukan 0/default) TIDAK pernah ditimpa,
    // supaya aman dari menghapus editan manual user lewat UI.
    const { rows: existingObatFull } = await client.query('SELECT * FROM obat');
    const existingObatByName = new Map(existingObatFull.map((o) => [o.nama.trim().toLowerCase(), o]));
    const obatInBatchSet = new Set(); // nama yang sudah diproses dalam batch impor ini (cegah duplikat internal file)

    // Ambil nomor kode OBT-xxx terakhir sekali di awal, lalu increment manual
    // (hindari race antar-insert dalam satu proses sekuensial ini).
    const { rows: kodeRows } = await client.query(
      `SELECT kode FROM obat WHERE kode ~ '^OBT-[0-9]+$' ORDER BY CAST(SUBSTRING(kode FROM 5) AS INTEGER) DESC LIMIT 1`
    );
    let nextKodeNum = kodeRows.length ? parseInt(kodeRows[0].kode.replace('OBT-', '')) + 1 : 1;

    // Deteksi kemungkinan duplikat entry (nama beda tipis tapi No. Batch + harga
    // beli + expired identik — indikasi kuat obat yang sama diketik 2x dengan typo
    // nama, bukan dua batch beda). Tandai SEMUA baris kecuali yang pertama muncul.
    const batchFingerprintSeen = new Set();
    const dugaanDuplikatRows = new Set();
    for (const r of obatRows) {
      if (!r.no_batch) continue; // fingerprint cuma masuk akal kalau ada No. Batch nyata
      const fp = `${r.no_batch}|${r.expired_batch ?? ''}|${r.harga_beli ?? ''}`;
      if (batchFingerprintSeen.has(fp)) {
        dugaanDuplikatRows.add(r.row);
      } else {
        batchFingerprintSeen.add(fp);
      }
    }

    // Obat yang sudah punya stok (hasil backfill run sebelumnya atau transaksi
    // manual) tidak boleh dapat Stok Masuk "Stok Awal" kedua kali dalam proses ini.
    const obatSudahDiberiStokAwal = new Set();

    // Backfill: obat SUDAH ada (nama match). Cuma isi field yang masih default/kosong
    // di database DAN punya nilai baru di Excel. Field yang sudah terisi nilai nyata
    // di database tidak disentuh sama sekali.
    async function prosesBackfill(r, existing) {
      const updates = {}; // kolom → nilai baru, cuma yang benar-benar berubah
      const perubahan = []; // untuk laporan: "field: lama → baru"

      const kategori = normalizeKategori(r.kategoriRaw);
      const satuan = normalizeSatuan(r.satuanRaw);

      // kategori: database masih "Lainnya" (default fallback) DAN Excel punya kategori
      // lebih spesifik → backfill. Kalau database sudah kategori spesifik, tidak disentuh.
      if (existing.kategori === 'Lainnya' && kategori.value !== 'Lainnya') {
        updates.kategori = kategori.value;
        perubahan.push(`kategori: "Lainnya" → "${kategori.value}"`);
      }

      // harga_beli: database masih 0, Excel punya harga per dus → konversi ke per-satuan dulu.
      const existingHargaBeli = parseFloat(existing.harga_beli) || 0;
      if (existingHargaBeli <= 0 && r.harga_beli && r.harga_beli > 0) {
        const hbPerSatuan = parseFloat((r.harga_beli / r.satuan_per_dus).toFixed(4));
        updates.harga_beli = hbPerSatuan;
        perubahan.push(`harga_beli: 0 → ${hbPerSatuan}`);
        // biaya_simpan ikut di-backfill kalau masih 0 juga, dari harga_beli baru ini
        const existingBiayaSimpan = parseFloat(existing.biaya_simpan) || 0;
        if (existingBiayaSimpan <= 0) {
          const biayaSimpanBaru = parseFloat((hbPerSatuan * (DEFAULT_BIAYA_SIMPAN_PCT / 100)).toFixed(4));
          updates.biaya_simpan = biayaSimpanBaru;
          perubahan.push(`biaya_simpan: 0 → ${biayaSimpanBaru}`);
        }
      }

      // harga_jual: database masih 0, Excel punya nilai baru.
      const existingHargaJual = parseFloat(existing.harga_jual) || 0;
      if (existingHargaJual <= 0 && r.harga_jual && r.harga_jual > 0) {
        updates.harga_jual = r.harga_jual;
        perubahan.push(`harga_jual: 0 → ${r.harga_jual}`);
      }

      // supplier: database belum ada supplier_id, Excel punya nama supplier.
      let supplierEntryBackfill = null;
      if (!existing.supplier_id && r.supplierRaw) {
        const supplierNamaBaku = normalizeSupplierName(r.supplierRaw);
        supplierEntryBackfill = supplierByNameLower.get(supplierNamaBaku.toLowerCase());
        if (supplierEntryBackfill) {
          updates.supplier_id = supplierEntryBackfill.id;
          updates.nama_supplier = supplierEntryBackfill.nama;
          perubahan.push(`supplier: (kosong) → "${supplierEntryBackfill.nama}"`);
        }
      }

      // stok awal: database masih stok=0 (dan belum pernah diberi Stok Awal di proses
      // impor ini), Excel sekarang punya data batch lengkap (jumlah > 0, harga_beli ada).
      let stokAwalBaru = null;
      const existingStok = parseInt(existing.stok) || 0;
      if (
        existingStok <= 0 &&
        !obatSudahDiberiStokAwal.has(existing.id) &&
        r.jumlah_batch && r.jumlah_batch > 0 &&
        r.harga_beli && r.harga_beli > 0
      ) {
        stokAwalBaru = r.jumlah_batch;
        perubahan.push(`stok: 0 → ${stokAwalBaru} (buat transaksi Stok Masuk "Stok Awal")`);
      }

      if (perubahan.length === 0) {
        laporan.obatDilewati.push({ row: r.row, nama: r.nama, alasan: 'nama obat sudah ada, tidak ada field kosong yang bisa dilengkapi dari baris ini' });
        return;
      }

      if (COMMIT) {
        const setClauses = Object.keys(updates).map((col, i) => `${col} = $${i + 1}`);
        if (setClauses.length > 0) {
          const values = Object.values(updates);
          await client.query(
            `UPDATE obat SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length + 1}`,
            [...values, existing.id]
          );
        }

        if (stokAwalBaru !== null) {
          const hargaBeliUntukBatch = updates.harga_beli ?? existingHargaBeli;
          const jumlah_dus = parseFloat((stokAwalBaru / r.satuan_per_dus).toFixed(4));
          await client.query(
            `INSERT INTO barang_masuk
               (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, no_batch, expired_batch, catatan, harga_beli, harga_jual, stok_sebelum, stok_sesudah)
             VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, 'Stok Awal', $8, $9, 0, $3)`,
            [
              existing.id, jumlah_dus, stokAwalBaru,
              updates.supplier_id ?? existing.supplier_id ?? null,
              r.no_faktur, r.no_batch, r.expired_batch,
              hargaBeliUntukBatch, updates.harga_jual ?? existingHargaJual,
            ]
          );
          await client.query('UPDATE obat SET stok = $1, expired_terdekat = $2, updated_at = NOW() WHERE id = $3', [stokAwalBaru, r.expired_batch, existing.id]);
          obatSudahDiberiStokAwal.add(existing.id);
        }

        // Hitung ulang EOQ/SS/ROP kalau ada field numerik yang berubah
        const { rows: obatFresh } = await client.query('SELECT * FROM obat WHERE id = $1', [existing.id]);
        const hasil = kalkulasiLengkap(obatFresh[0]);
        await client.query(
          'UPDATE obat SET eoq=$1, safety_stock=$2, rop=$3, total_biaya=$4, updated_at=NOW() WHERE id=$5',
          [hasil.eoq, hasil.safety_stock, hasil.rop, hasil.total_biaya, existing.id]
        );
      }

      laporan.obatDiupdate.push({ row: r.row, nama: r.nama, obatId: existing.id, perubahan });
    }

    for (const r of obatRows) {
      const namaKey = r.nama.trim().toLowerCase();

      if (dugaanDuplikatRows.has(r.row)) {
        laporan.bermasalah.push({ row: r.row, nama: r.nama, alasan: `kemungkinan duplikat entry — No. Batch "${r.no_batch}", Harga Beli, dan Expired identik dengan baris lain bernama berbeda (cek typo nama)` });
        continue;
      }
      if (obatInBatchSet.has(namaKey)) {
        laporan.obatDilewati.push({ row: r.row, nama: r.nama, alasan: 'nama duplikat di dalam file Excel (baris sebelumnya sudah diproses di run ini)' });
        continue;
      }
      if (existingObatByName.has(namaKey)) {
        await prosesBackfill(r, existingObatByName.get(namaKey));
        obatInBatchSet.add(namaKey);
        continue;
      }
      // Kategori kosong TIDAK memblokir (normalizeKategori akan fallback ke
      // "Lainnya"), tapi satuan wajib ada karena kolom satuan NOT NULL dan tidak
      // ada default yang masuk akal untuk itu (beda dari kategori yang punya "Lainnya").
      if (!r.satuanRaw) {
        laporan.bermasalah.push({ row: r.row, nama: r.nama, alasan: 'satuan kosong' });
        continue;
      }
      if (r.expired_batch === undefined) {
        laporan.bermasalah.push({ row: r.row, nama: r.nama, alasan: `tanggal expired tidak terbaca: "${r.expired_raw}"` });
        continue;
      }
      // Kalau ada data batch (jumlah/batch/expired) tapi harga_beli kosong → tidak
      // bisa dihitung biaya_simpan dari harga beli, tandai bermasalah supaya dicek manual.
      const punyaDataBatch = r.jumlah_batch !== null || r.no_batch || r.expired_batch;
      if (punyaDataBatch && r.harga_beli === null) {
        laporan.bermasalah.push({ row: r.row, nama: r.nama, alasan: 'ada data batch/stok tapi Harga Beli kosong — tidak bisa hitung biaya simpan & stok masuk' });
        continue;
      }
      // No. Batch dan/atau Expired sudah diisi (usaha nyata input data), tapi Jumlah
      // di Batch Ini kosong/0 — kemungkinan salah ketik/lupa isi, bukan memang stok 0.
      // Jangan diam-diam buang info batch/expired-nya: tandai bermasalah supaya
      // dicek manual (tanya apotek) sebelum diimpor ulang, daripada datanya hilang.
      const punyaIdentitasBatch = r.no_batch || r.expired_batch;
      const jumlahKosongAtauNol = !r.jumlah_batch || r.jumlah_batch <= 0;
      if (punyaIdentitasBatch && jumlahKosongAtauNol) {
        laporan.bermasalah.push({ row: r.row, nama: r.nama, alasan: `No. Batch/Expired sudah diisi tapi Jumlah di Batch Ini kosong atau 0 (batch="${r.no_batch ?? '-'}", expired="${r.expired_batch ?? '-'}")` });
        continue;
      }

      const kategori = normalizeKategori(r.kategoriRaw);
      const satuan = normalizeSatuan(r.satuanRaw);
      const supplierNamaBaku = r.supplierRaw ? normalizeSupplierName(r.supplierRaw) : null;
      const supplierEntry = supplierNamaBaku ? supplierByNameLower.get(supplierNamaBaku.toLowerCase()) : null;

      if (supplierNamaBaku && !supplierEntry) {
        laporan.bermasalah.push({ row: r.row, nama: r.nama, alasan: `supplier "${r.supplierRaw}" tidak ditemukan di sheet B maupun database` });
        continue;
      }

      // PENTING: kolom G Excel "Harga Beli (per satuan pesan)" adalah harga per
      // dus/box (misal Rp120.000/box isi 15 strip), TAPI obat.harga_beli di
      // database selalu disimpan per satuan TERKECIL (sama seperti alur Stok
      // Masuk — lihat barangMasukController.js: harga_beli_per_satuan = harga_beli_dus / spd).
      // Harus dibagi satuan_per_dus di sini, atau harga per unit akan salah
      // berkali-lipat (dan biaya_simpan yang diturunkan darinya ikut salah).
      // Kolom H "Harga Jual (per satuan terkecil)" sudah per satuan, tidak perlu dikonversi.
      const harga_beli_per_dus = r.harga_beli || 0;
      const harga_beli = harga_beli_per_dus > 0
        ? parseFloat((harga_beli_per_dus / r.satuan_per_dus).toFixed(4))
        : 0;
      const harga_jual = r.harga_jual || 0;
      const biaya_simpan = harga_beli > 0
        ? parseFloat((harga_beli * (DEFAULT_BIAYA_SIMPAN_PCT / 100)).toFixed(4))
        : 0;
      const stok_awal = r.jumlah_batch && r.jumlah_batch > 0 ? r.jumlah_batch : 0;

      const kode = `OBT-${String(nextKodeNum).padStart(3, '0')}`;

      const entry = {
        row: r.row,
        kode,
        nama: r.nama,
        kategori: kategori.value,
        kategoriAsli: kategori.changed ? r.kategoriRaw : undefined,
        satuan: satuan.value,
        satuanAsli: satuan.changed ? r.satuanRaw : undefined,
        satuan_per_dus: r.satuan_per_dus,
        harga_beli,
        harga_jual,
        biaya_simpan,
        stok_awal,
        supplier: supplierNamaBaku,
        no_batch: r.no_batch,
        no_faktur: r.no_faktur,
        expired_batch: r.expired_batch,
      };

      if (COMMIT) {
        const { rows: obatInsert } = await client.query(
          `INSERT INTO obat (
             kode, nama, kategori, satuan, satuan_per_dus,
             harga_beli, harga_jual, stok,
             biaya_pesan, biaya_simpan,
             lead_time, service_level,
             supplier_id, nama_supplier
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12,$13)
           RETURNING id`,
          [
            kode, r.nama, kategori.value, satuan.value, r.satuan_per_dus,
            harga_beli, harga_jual,
            DEFAULT_BIAYA_PESAN, biaya_simpan,
            DEFAULT_LEAD_TIME, DEFAULT_SERVICE_LEVEL,
            supplierEntry?.id ?? null, supplierEntry?.nama ?? null,
          ]
        );
        const obatId = obatInsert[0].id;

        if (stok_awal > 0) {
          const jumlah_dus = parseFloat((stok_awal / r.satuan_per_dus).toFixed(4));
          await client.query(
            `INSERT INTO barang_masuk
               (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, no_batch, expired_batch, catatan, harga_beli, harga_jual, stok_sebelum, stok_sesudah)
             VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, 'Stok Awal', $8, $9, 0, $3)`,
            [obatId, jumlah_dus, stok_awal, supplierEntry?.id ?? null, r.no_faktur, r.no_batch, r.expired_batch, harga_beli, harga_jual]
          );
          await client.query('UPDATE obat SET stok = $1, expired_terdekat = $2, updated_at = NOW() WHERE id = $3', [stok_awal, r.expired_batch, obatId]);
        }

        // Hitung ulang EOQ/SS/ROP (akan null karena belum ada histori demand — normal untuk obat baru)
        const { rows: obatFresh } = await client.query('SELECT * FROM obat WHERE id = $1', [obatId]);
        const hasil = kalkulasiLengkap(obatFresh[0]);
        await client.query(
          'UPDATE obat SET eoq=$1, safety_stock=$2, rop=$3, total_biaya=$4, updated_at=NOW() WHERE id=$5',
          [hasil.eoq, hasil.safety_stock, hasil.rop, hasil.total_biaya, obatId]
        );

        entry.obatId = obatId;
      }

      obatInBatchSet.add(namaKey);
      nextKodeNum++;
      laporan.obatMasuk.push(entry);
    }

    if (COMMIT) {
      await client.query('COMMIT');
    }
  } catch (err) {
    if (COMMIT) await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Gagal, semua perubahan di-rollback:', err.message);
    throw err;
  } finally {
    client.release();
  }

  // ── Laporan akhir ──────────────────────────────────────────────────────────
  console.log('='.repeat(70));
  console.log('LAPORAN IMPOR');
  console.log('='.repeat(70));

  console.log(`\nSupplier baru: ${laporan.supplierBaru.length}`);
  laporan.supplierBaru.forEach((s) => console.log(`  + ${s.nama}`));
  console.log(`Supplier dilewati (sudah ada): ${laporan.supplierDilewati.length}`);

  console.log(`\nObat masuk: ${laporan.obatMasuk.length}`);
  const obatDenganStok = laporan.obatMasuk.filter((o) => o.stok_awal > 0);
  console.log(`  - dengan stok awal (buat transaksi Stok Masuk): ${obatDenganStok.length}`);
  console.log(`  - tanpa stok (data master saja): ${laporan.obatMasuk.length - obatDenganStok.length}`);

  const kategoriDiubah = laporan.obatMasuk.filter((o) => o.kategoriAsli);
  if (kategoriDiubah.length) {
    console.log(`\nKategori dinormalisasi (${kategoriDiubah.length} dari ${laporan.obatMasuk.length} baris), contoh:`);
    kategoriDiubah.slice(0, 10).forEach((o) => console.log(`  row ${o.row}: "${o.kategoriAsli}" → "${o.kategori}"`));
    if (kategoriDiubah.length > 10) console.log(`  ... dan ${kategoriDiubah.length - 10} lainnya`);
  }

  console.log('\nDistribusi kategori final (semua obat masuk):');
  const kategoriFinalCount = {};
  laporan.obatMasuk.forEach((o) => { kategoriFinalCount[o.kategori] = (kategoriFinalCount[o.kategori] || 0) + 1; });
  Object.entries(kategoriFinalCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, n]) => console.log(`  ${String(n).padStart(4)}  ${k}`));

  console.log(`\nObat di-backfill (nama sudah ada, field kosong dilengkapi): ${laporan.obatDiupdate.length}`);
  laporan.obatDiupdate.slice(0, 15).forEach((o) => {
    console.log(`  row ${o.row} — "${o.nama}":`);
    o.perubahan.forEach((p) => console.log(`      ${p}`));
  });
  if (laporan.obatDiupdate.length > 15) console.log(`  ... dan ${laporan.obatDiupdate.length - 15} obat lainnya`);

  console.log(`\nObat dilewati: ${laporan.obatDilewati.length}`);
  if (laporan.obatDilewati.length) {
    const alasanCount = {};
    laporan.obatDilewati.forEach((o) => { alasanCount[o.alasan] = (alasanCount[o.alasan] || 0) + 1; });
    Object.entries(alasanCount).forEach(([alasan, n]) => console.log(`  - ${alasan}: ${n}`));
  }

  console.log(`\nBaris bermasalah (dilewati, perlu dicek manual): ${laporan.bermasalah.length}`);
  laporan.bermasalah.forEach((b) => console.log(`  row ${b.row} — "${b.nama}": ${b.alasan}`));

  console.log('\n' + '='.repeat(70));
  if (!COMMIT) {
    console.log('Ini DRY RUN — tidak ada yang ditulis ke database.');
    console.log('Jalankan ulang dengan --commit untuk benar-benar menulis.');
  } else {
    console.log('✓ Selesai — data sudah ditulis ke database.');
  }
  console.log('='.repeat(70));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
