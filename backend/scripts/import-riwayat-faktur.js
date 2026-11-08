/**
 * Script sekali jalan: masukkan baris faktur Agustus–Oktober 2026 ke barang_masuk
 * sebagai "Riwayat faktur" — tanggal, supplier, no. faktur, batch, expired, dan harga
 * sesuai faktur asli, supaya muncul di halaman Barang Masuk dan Laporan.
 *
 * STOK TIDAK DITAMBAH: snapshot stok 27 Okt sudah memuat barang dari faktur ini.
 * Maka stok_sebelum = stok_sesudah = stok obat saat ini, obat.stok tidak disentuh.
 * Baris ditandai catatan "Riwayat faktur…" dan dikecualikan dari hitungan sisa batch /
 * expired terdekat / kartu stok (lihat stokService, laporanController, dst), serta tidak
 * bisa diedit dan hapusnya tidak mengurangi stok (barangMasukController).
 *
 * Cakupan: hanya baris faktur yang No. Batch-nya cocok persis dengan baris "Stok Awal"
 * obat yang sudah ada di DB. Produk yang belum ada di DB tidak dibuat.
 *
 * Aman dijalankan ulang (baris yang sudah ada dilewati). Default DRY RUN.
 *   node scripts/import-riwayat-faktur.js
 *   node scripts/import-riwayat-faktur.js --commit   (backup tabel dulu)
 */

require('dotenv').config();
const ExcelJS = require('exceljs');
const pool = require('../src/db/pool');

const COMMIT = process.argv.includes('--commit');
const EXCEL_PATH = '../docs/data-apotek/Barang_Masuk_Agustus_Oktober_2026.xlsx';
const TANDA = 'Riwayat faktur';

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
const tgl = (d) => (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT' : 'DRY RUN (tidak menulis apa pun)'}\n`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.getWorksheet('Barang Masuk');

  const { rows: suppliers } = await pool.query('SELECT id, nama FROM supplier');
  const supByName = new Map(suppliers.map((s) => [s.nama.toLowerCase(), s.id]));

  const { rows: sa } = await pool.query(
    `SELECT bm.obat_id, bm.no_batch, o.nama, o.satuan_per_dus AS spd, o.stok, o.harga_jual
     FROM barang_masuk bm JOIN obat o ON o.id = bm.obat_id
     WHERE bm.catatan LIKE 'Stok Awal%' AND bm.no_batch IS NOT NULL`
  );
  const byBatch = new Map(sa.map((b) => [String(b.no_batch).trim().toLowerCase(), b]));

  const { rows: sudah } = await pool.query(
    `SELECT obat_id, no_faktur, no_batch FROM barang_masuk WHERE catatan LIKE '${TANDA}%'`
  );
  const sudahSet = new Set(sudah.map((s) => `${s.obat_id}|${s.no_faktur}|${String(s.no_batch).toLowerCase()}`));

  const baru = [];
  let tidakDiDb = 0, sudahAda = 0;
  for (let r = 2; r <= ws.rowCount; r++) {
    const g = (i) => cellValue(ws.getRow(r).getCell(i));
    if (!g(6)) continue;
    const ob = byBatch.get(String(g(12) || '').trim().toLowerCase());
    if (!ob) { tidakDiDb++; continue; }

    const qty = parseFloat(g(7));
    const supId = supByName.get(String(g(3)).toLowerCase());
    const ppn = g(14) === 'Tidak' && g(9) && g(15) ? Math.round((g(15) / g(9) - 1) * 100) : 0;
    const hargaSatuan = g(15) ? parseFloat((g(15) / (ob.spd || 1)).toFixed(4)) : null;
    const item = {
      row: r, tanggal: tgl(g(2)), obatId: ob.obat_id, obatNama: ob.nama, namaFaktur: g(6),
      jumlahDus: qty, jumlahSatuan: Math.round(qty * (ob.spd || 1)), supId, noFaktur: String(g(4)),
      noBatch: String(g(12)), expired: g(13) ? tgl(g(13)) : null, hargaSatuan, hargaJual: ob.harga_jual,
      ppn, stok: ob.stok, ragu: g(17) === 'Ragu', catatanSumber: g(18),
    };
    if (!qty || qty <= 0 || !supId) { console.log(`  DILEWATI row ${r} (qty/supplier tidak valid)`); continue; }
    if (sudahSet.has(`${item.obatId}|${item.noFaktur}|${item.noBatch.toLowerCase()}`)) { sudahAda++; continue; }
    baru.push(item);
  }

  console.log(`Baris faktur di Excel                 : ${ws.rowCount - 1}`);
  console.log(`Akan dimasukkan sebagai riwayat       : ${baru.length}`);
  console.log(`Sudah pernah dimasukkan (dilewati)    : ${sudahAda}`);
  console.log(`Produk/batch tidak ada di DB (dilewati): ${tidakDiDb}\n`);
  const perTgl = {};
  baru.forEach((b) => (perTgl[b.tanggal] = (perTgl[b.tanggal] || 0) + 1));
  console.log('Per tanggal faktur:', perTgl);
  const ragu = baru.filter((b) => b.ragu);
  if (ragu.length) console.log(`Bertanda "Ragu" di Excel: ${ragu.map((b) => 'row ' + b.row).join(', ')}`);
  console.log('\nContoh 8 baris pertama:');
  baru.slice(0, 8).forEach((b) => console.log(`  ${b.tanggal} ${b.noFaktur} | ${b.namaFaktur} -> ${b.obatNama} | ${b.jumlahDus} dus = ${b.jumlahSatuan} sat | harga/sat ${b.hargaSatuan} ppn ${b.ppn}%`));

  if (!COMMIT) {
    console.log('\nDRY RUN — tidak ada yang ditulis. obat.stok TIDAK akan diubah. Jalankan ulang dengan --commit.');
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS barang_masuk_backup_riwayat');
    await client.query('CREATE TABLE barang_masuk_backup_riwayat AS SELECT * FROM barang_masuk');
    for (const b of baru) {
      const catatan = `${TANDA} (stok tidak ditambah — sudah termasuk snapshot stok)${b.ragu ? ' | data faktur ragu: ' + (b.catatanSumber || '') : ''}`;
      await client.query(
        `INSERT INTO barang_masuk
           (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, no_batch, expired_batch,
            catatan, harga_beli, harga_jual, ppn_pct, user_id, stok_sebelum, stok_sesudah)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL,$13,$13)`,
        [b.tanggal, b.obatId, b.jumlahDus, b.jumlahSatuan, b.supId, b.noFaktur, b.noBatch, b.expired,
         catatan, b.hargaSatuan, b.hargaJual, b.ppn, b.stok]
      );
    }
    await client.query('COMMIT');
    console.log(`\n✓ ${baru.length} baris riwayat faktur dimasukkan. Backup: barang_masuk_backup_riwayat. obat.stok tidak diubah.`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Gagal, di-rollback:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
