/**
 * Script sekali jalan: impor transaksi penjualan (barang_keluar) dari hasil
 * pencocokan nama obat di Transkrip_Penjualan_Oktober_2026.xlsx.
 *
 * Sumber data: sheet "Semua Data" di file Excel, baris dengan Keyakinan
 * "Jelas"/"Ragu" (bukan "Tidak terbaca"), dicocokkan ke 82 obat yang ada di
 * database lewat algoritma token-overlap (lihat match-penjualan.js).
 *
 * Diproses URUT TANGGAL (kronologis) — bukan sekaligus — karena stok yang
 * tersedia sekarang terbatas (hasil impor data_obat_aptl_Rezky.xlsx bulan
 * lalu), sementara total penjualan 1 bulan sering melebihi stok itu. Baris
 * yang membuat stok minus GAGAL SENDIRI (dilaporkan, dilewati), tidak
 * membatalkan baris lain — beda dari import-data-obat.js yang pakai 1 transaksi.
 *
 * Mode default = DRY RUN: hanya mencetak laporan, tidak menulis apa pun.
 * Jalankan dengan --commit untuk benar-benar menulis ke database.
 *
 * Jalankan dari folder /backend:
 *   node scripts/import-penjualan-oktober.js             (dry-run)
 *   node scripts/import-penjualan-oktober.js --commit     (tulis ke DB)
 */

require('dotenv').config();
const ExcelJS = require('exceljs');
const pool = require('../src/db/pool');
const { hitungUlangObat, updateExpiredTerdekat } = require('../src/services/stokService');

const COMMIT = process.argv.includes('--commit');
const EXCEL_PATH = '../docs/data-apotek/Transkrip_Penjualan_Oktober_2026.xlsx';
const SCORE_MIN = 0.6;

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

// ─── Matching (sama persis dengan match-penjualan.js) ──────────────────────

const ALIAS = [
  [/\bdexamethasone\b/g, 'dexametason'],
  [/\bm\.?\s*tawon\b/g, 'minyak tawon'],
  [/\bpct\b/g, 'paracetamol'],
  [/\bbtl\b/g, 'botol'],
  [/\bstr\b|\bstp\b/g, 'strip'],
  [/\bsch\b/g, 'sachet'],
  [/\bmetilprednisolon\b/g, 'methylprednisolon'],
  [/\bomeprazol\b/g, 'omeprazole'],
  [/\blansoprazol\b/g, 'lansoprazole'],
];

function normalize(s) {
  let out = String(s || '').toLowerCase();
  for (const [pattern, repl] of ALIAS) out = out.replace(pattern, repl);
  return out
    .replace(/[0-9]+\s*(mg|ml|g|gr|y|x\d+)?/gi, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDoses(s) {
  const str = String(s || '').replace(',', '.');
  const matches = str.match(/\d+(\.\d+)?\s*(mg|ml|g|gr)?/gi) || [];
  return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n) && n > 0);
}

const VARIAN_WORDS = [
  'hot', 'citrus', 'strong', 'merah', 'hijau', 'kuning', 'putih', 'matcha',
  'fruity', 'jahe', 'jeruk', 'nipis', 'mint', 'menthol', 'orange', 'straw',
  'strawberry', 'cherry', 'anak', 'dewasa', 'dws',
];

function extractVarian(s) {
  return normalize(s).split(' ').filter((w) => VARIAN_WORDS.includes(w));
}

const STOPWORDS = new Set([
  'tab', 'tablet', 'syr', 'syrup', 'sirup', 'kapsul', 'caps', 'strip', 'botol',
  'tube', 'sachet', 'krim', 'cream', 'cr', 'dus', 'box', 'pcs', 'drop', 'gel',
  'sakit', 'kepala', 'obat',
]);

function tokenOverlap(a, b) {
  const ta = new Set(normalize(a).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w)));
  const tb = new Set(normalize(b).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w)));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  let score = common / Math.max(ta.size, tb.size);

  const dosesA = extractDoses(a);
  const dosesB = extractDoses(b);
  if (dosesA.length > 0 && dosesB.length > 0) {
    const adaYangCocok = dosesA.some((da) => dosesB.some((db) => Math.abs(da - db) < 0.01));
    if (!adaYangCocok) score *= 0.3;
  }

  const varianA = extractVarian(a);
  const varianB = extractVarian(b);
  if (varianA.length > 0 && varianB.length > 0) {
    const adaVarianCocok = varianA.some((va) => varianB.includes(va));
    if (!adaVarianCocok) return 0;
  }

  return score;
}

function normalizeSatuanTulisan(s) {
  const raw = String(s || '').toLowerCase().trim();
  const map = { stp: 'strip', str: 'strip', sch: 'sachet', btl: 'botol' };
  return map[raw] || raw;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT (akan menulis ke database)' : 'DRY RUN (tidak menulis apa pun)'}\n`);

  const { rows: obatList } = await pool.query('SELECT id, nama, satuan, stok FROM obat ORDER BY nama');
  const obatById = new Map(obatList.map((o) => [o.id, o]));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.getWorksheet('Semua Data');

  // ── 1. Matching + validasi dasar (sama untuk dry-run maupun commit) ──────
  const kandidat = [];
  const laporan = { dilewatiTidakTerbaca: 0, dilewatiTidakMatch: 0, bermasalah: [] };

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const keyakinan = cellValue(row.getCell(10));
    if (keyakinan === 'Tidak terbaca' || !keyakinan) { laporan.dilewatiTidakTerbaca++; continue; }

    const tanggal = cellValue(row.getCell(2));
    const tulisanAsli = cellValue(row.getCell(5));
    const namaTebakan = cellValue(row.getCell(6));
    const jumlahRaw = cellValue(row.getCell(7));
    const satuanRaw = cellValue(row.getCell(8));

    if (!tulisanAsli || !tanggal) continue;
    const jumlah = parseInt(jumlahRaw);
    if (!jumlah || jumlah <= 0) {
      laporan.bermasalah.push({ row: r, tulisanAsli, alasan: `jumlah tidak valid: "${jumlahRaw}"` });
      continue;
    }

    let best = null;
    let bestScore = 0;
    for (const o of obatList) {
      const score = Math.max(tokenOverlap(namaTebakan, o.nama), tokenOverlap(tulisanAsli, o.nama));
      if (score > bestScore) { bestScore = score; best = o; }
    }

    if (!best || bestScore < SCORE_MIN) { laporan.dilewatiTidakMatch++; continue; }

    kandidat.push({
      row: r, tanggal: new Date(tanggal), tulisanAsli, namaTebakan, jumlah,
      satuanTulisan: normalizeSatuanTulisan(satuanRaw), keyakinan,
      obatId: best.id, obatNama: best.nama, satuanDb: best.satuan, score: bestScore,
    });
  }

  // Urutkan kronologis — penting karena stok dicek berurutan per hari
  kandidat.sort((a, b) => a.tanggal - b.tanggal || a.row - b.row);

  console.log(`Total baris di sheet (Jelas+Ragu+Tidak terbaca): dilewati ${laporan.dilewatiTidakTerbaca} (tidak terbaca)`);
  console.log(`Match ke obat DB (skor >= ${SCORE_MIN}): ${kandidat.length}`);
  console.log(`Tidak match ke obat manapun di DB: ${laporan.dilewatiTidakMatch}`);
  console.log(`Baris bermasalah (jumlah invalid): ${laporan.bermasalah.length}`);

  // ── 2. Proses satu per satu, urut tanggal — simulasikan stok berjalan ────
  // stokBerjalan dimulai dari stok DB saat ini, dikurangi tiap transaksi yang
  // berhasil, supaya transaksi berikutnya (tanggal lebih baru) tahu stok sisa
  // yang benar — bukan selalu baca stok awal yang sama.
  const stokBerjalan = new Map(obatList.map((o) => [o.id, o.stok]));
  const berhasil = [];
  const gagalStok = [];

  for (const k of kandidat) {
    const stokSekarang = stokBerjalan.get(k.obatId);
    if (stokSekarang < k.jumlah) {
      gagalStok.push({ ...k, stokTersedia: stokSekarang });
      continue;
    }
    stokBerjalan.set(k.obatId, stokSekarang - k.jumlah);
    berhasil.push({ ...k, stokSebelum: stokSekarang, stokSesudah: stokSekarang - k.jumlah });
  }

  console.log(`\nTransaksi yang akan dicatat (stok cukup): ${berhasil.length}`);
  console.log(`Dilewati karena stok tidak cukup: ${gagalStok.length}`);

  if (gagalStok.length) {
    console.log('\nContoh baris gagal karena stok tidak cukup (10 pertama):');
    gagalStok.slice(0, 10).forEach((g) => {
      console.log(`  ${g.tanggal.toISOString().slice(0, 10)} row ${g.row} — "${g.tulisanAsli}" -> ${g.obatNama}: butuh ${g.jumlah}, stok tersisa ${g.stokTersedia}`);
    });
    if (gagalStok.length > 10) console.log(`  ... dan ${gagalStok.length - 10} baris lainnya`);
  }

  // ── 3. Ringkasan per obat ────────────────────────────────────────────────
  console.log('\nRingkasan per obat (berhasil dicatat):');
  const perObat = {};
  berhasil.forEach((b) => {
    perObat[b.obatNama] = perObat[b.obatNama] || { total: 0, stokAwal: stokBerjalan.get(b.obatId) + b.jumlah };
    perObat[b.obatNama].total += b.jumlah;
  });
  Object.entries(perObat).sort((a, b) => b[1].total - a[1].total).forEach(([nama, v]) => {
    console.log(`  ${nama}: terjual ${v.total}`);
  });

  if (!COMMIT) {
    console.log('\n' + '='.repeat(70));
    console.log('Ini DRY RUN — tidak ada yang ditulis ke database.');
    console.log('Jalankan ulang dengan --commit untuk benar-benar menulis.');
    console.log('='.repeat(70));
    await pool.end();
    return;
  }

  // ── 4. Commit — tiap baris transaksi sendiri (bukan 1 transaksi besar),
  // supaya 1 baris gagal tak terduga tidak membatalkan ratusan baris lain.
  let sukses = 0, gagalRuntime = 0;
  const obatTerdampak = new Set();

  for (const b of berhasil) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: cek } = await client.query('SELECT stok FROM obat WHERE id = $1 FOR UPDATE', [b.obatId]);
      if (!cek.length || cek[0].stok < b.jumlah) {
        await client.query('ROLLBACK');
        gagalRuntime++;
        continue;
      }
      const stokSesudahReal = cek[0].stok - b.jumlah;
      const { rows: obatRow } = await client.query('SELECT harga_jual FROM obat WHERE id = $1', [b.obatId]);
      await client.query(
        `INSERT INTO barang_keluar (tanggal, obat_id, jumlah, keterangan, catatan, stok_sebelum, stok_sesudah, harga_jual)
         VALUES ($1,$2,$3,'Penjualan',$4,$5,$6,$7)`,
        [
          b.tanggal.toISOString().slice(0, 10), b.obatId, b.jumlah,
          `Impor transkrip penjualan — tulisan asli: "${b.tulisanAsli}"`,
          cek[0].stok, stokSesudahReal, obatRow[0]?.harga_jual ?? null,
        ]
      );
      await client.query('UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2', [stokSesudahReal, b.obatId]);
      await client.query('COMMIT');
      sukses++;
      obatTerdampak.add(b.obatId);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`Gagal baris row ${b.row} (obat ${b.obatNama}):`, err.message);
      gagalRuntime++;
    } finally {
      client.release();
    }
  }

  console.log(`\n✓ ${sukses} transaksi Penjualan berhasil dicatat.`);
  if (gagalRuntime) console.log(`⚠️  ${gagalRuntime} gagal saat commit (lihat log di atas).`);

  // PENTING: demandService.hitungDemandDariRiwayat() pakai window "30 hari dari
  // HARI INI" (CURRENT_DATE) — tidak cocok untuk data historis Oktober yang
  // sudah lewat 30 hari dari sekarang (hasilnya akan selalu kosong/0). Di sini
  // demand dihitung manual dari RENTANG TANGGAL TRANSAKSI ITU SENDIRI (dari
  // transaksi Penjualan paling awal s.d. paling akhir yang tercatat untuk obat
  // itu), supaya EOQ/ROP punya dasar perhitungan meski datanya "masa lalu".
  console.log('\nMenghitung demand dari histori transaksi (bukan window 30 hari dari hari ini)...');
  for (const obatId of obatTerdampak) {
    try {
      const { rows: histori } = await pool.query(
        `SELECT tanggal, SUM(jumlah) AS total FROM barang_keluar
         WHERE obat_id = $1 AND keterangan = 'Penjualan'
         GROUP BY tanggal ORDER BY tanggal`,
        [obatId]
      );
      if (histori.length === 0) continue;

      const tanggalMin = new Date(histori[0].tanggal);
      const tanggalMax = new Date(histori[histori.length - 1].tanggal);
      const rentangHari = Math.max(1, Math.round((tanggalMax - tanggalMin) / 86400000) + 1);

      // Isi 0 untuk hari tanpa penjualan dalam rentang, sama seperti logika asli
      const byTanggal = new Map(histori.map((h) => [new Date(h.tanggal).toISOString().slice(0, 10), parseFloat(h.total)]));
      const harian = [];
      for (let i = 0; i < rentangHari; i++) {
        const d = new Date(tanggalMin);
        d.setDate(d.getDate() + i);
        harian.push(byTanggal.get(d.toISOString().slice(0, 10)) || 0);
      }

      const mean = harian.reduce((a, b) => a + b, 0) / harian.length;
      const variance = harian.length > 1
        ? harian.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (harian.length - 1)
        : 0;
      const stdDev = Math.sqrt(variance);

      await pool.query(
        'UPDATE obat SET demand_harian = $1, std_dev_demand = $2, demand_tahunan = $3, updated_at = NOW() WHERE id = $4',
        [mean.toFixed(4), stdDev.toFixed(4), Math.round(mean * 365), obatId]
      );

      await updateExpiredTerdekat(obatId);
      await hitungUlangObat(obatId);
    } catch (err) {
      console.error(`Hitung demand gagal untuk obat ${obatId}:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✓ Selesai.');
  console.log('='.repeat(70));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
