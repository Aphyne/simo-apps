/**
 * Script sekali jalan: lengkapi riwayat barang masuk (baris "Stok Awal") dengan
 * data faktur dari Barang_Masuk_Agustus_Oktober_2026.xlsx.
 *
 * PRINSIP: stok DB (snapshot 27 Okt) SUDAH memuat barang dari faktur ini, jadi
 * skrip ini TIDAK menambah baris barang_masuk baru dan TIDAK mengubah obat.stok,
 * jumlah, maupun tanggal. Rumus stok = total masuk - total keluar tetap utuh.
 *
 * Yang dikerjakan: baris faktur yang No. Batch-nya SAMA dengan batch sebuah baris
 * "Stok Awal" -> baris Stok Awal itu dilengkapi:
 *   - no_faktur   : diisi hanya kalau masih kosong
 *   - supplier_id : diisi hanya kalau masih kosong
 *   - harga_beli + ppn_pct : kalau harga di DB = harga faktur SEBELUM PPN (toleransi 2%),
 *                   dikoreksi ke harga + PPN per satuan (konvensi aplikasi: harga_beli
 *                   sudah termasuk PPN). Harga master obat ikut dikoreksi (hanya kalau
 *                   belum pernah diedit), lalu EOQ/ROP dihitung ulang. Yang tidak cocok
 *                   tidak ditimpa dan dilaporkan.
 *   - catatan     : ditambah " | Faktur <no> (<tanggal>)"
 * Baris yang tidak pasti (batch tidak ketemu, nama tidak mirip, ambigu) TIDAK
 * disentuh dan dilaporkan.
 *
 * Mode default = DRY RUN. Jalankan dengan --commit untuk menulis (otomatis bikin
 * tabel backup barang_masuk_backup_faktur dulu).
 *
 * Jalankan dari folder /backend:
 *   node scripts/import-faktur-barang-masuk.js
 *   node scripts/import-faktur-barang-masuk.js --commit
 */

require('dotenv').config();
const ExcelJS = require('exceljs');
const pool = require('../src/db/pool');

const COMMIT = process.argv.includes('--commit');
const EXCEL_PATH = '../docs/data-apotek/Barang_Masuk_Agustus_Oktober_2026.xlsx';
const NAMA_MIN_SCORE = 0.3; // batch sudah pasti; nama hanya pengaman tambahan

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

function tokens(s) {
  return new Set(
    String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
      .filter((w) => w.length > 2 && !['tab', 'tablet', 'syr', 'syrup', 'strip', 'botol', 'box', 'caps', 'kaplet'].includes(w))
  );
}
function namaOverlap(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let c = 0;
  for (const t of ta) if (tb.has(t) || [...tb].some((x) => x.startsWith(t) || t.startsWith(x))) c++;
  return c / Math.min(ta.size, tb.size);
}

const tglStr = (d) => (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT (menulis ke database)' : 'DRY RUN (tidak menulis apa pun)'}\n`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.getWorksheet('Barang Masuk');
  const faktur = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const g = (i) => cellValue(ws.getRow(r).getCell(i));
    if (!g(6)) continue;
    faktur.push({
      row: r, tanggal: g(2), supplier: g(3), noFaktur: g(4), nama: g(6),
      qty: g(7), satuan: g(8), hargaExcl: g(9), hargaPlusPpn: g(15), ppnIncl: g(14), batch: g(12), keyakinan: g(17),
    });
  }

  const { rows: suppliers } = await pool.query('SELECT id, nama FROM supplier');
  const supByName = new Map(suppliers.map((s) => [s.nama.toLowerCase(), s.id]));

  // Hanya baris Stok Awal yang punya no_batch
  const { rows: sa } = await pool.query(
    `SELECT bm.id, bm.obat_id, bm.no_batch, bm.no_faktur, bm.supplier_id, bm.harga_beli, bm.ppn_pct, bm.catatan,
            o.nama AS obat_nama, o.satuan_per_dus AS spd
     FROM barang_masuk bm JOIN obat o ON o.id = bm.obat_id
     WHERE bm.catatan LIKE 'Stok Awal%' AND bm.no_batch IS NOT NULL`
  );
  const saByBatch = new Map();
  for (const b of sa) {
    const k = String(b.no_batch).trim().toLowerCase();
    if (!saByBatch.has(k)) saByBatch.set(k, []);
    saByBatch.get(k).push(b);
  }

  const kandidat = [];
  const laporan = { batchTakKetemu: [], namaBeda: [], ambigu: [], sudahLengkap: 0 };

  for (const f of faktur) {
    const k = String(f.batch || '').trim().toLowerCase();
    const hit = saByBatch.get(k);
    if (!k || !hit) { laporan.batchTakKetemu.push(f); continue; }
    if (hit.length > 1) { laporan.ambigu.push({ f, alasan: 'batch sama dipakai >1 baris Stok Awal' }); continue; }
    const sb = hit[0];
    const score = namaOverlap(f.nama, sb.obat_nama);
    if (score < NAMA_MIN_SCORE) { laporan.namaBeda.push({ f, obat: sb.obat_nama, score }); continue; }
    kandidat.push({ f, sb, score });
  }

  // 2 baris faktur ke baris Stok Awal yang sama = ambigu (mis. 2 faktur 1 batch) -> skip keduanya
  const hitungPerSa = new Map();
  kandidat.forEach((c) => hitungPerSa.set(c.sb.id, (hitungPerSa.get(c.sb.id) || 0) + 1));
  const final = [];
  for (const c of kandidat) {
    if (hitungPerSa.get(c.sb.id) > 1) laporan.ambigu.push({ f: c.f, alasan: `>1 baris faktur ke obat "${c.sb.obat_nama}"` });
    else final.push(c);
  }

  const rencana = [];
  for (const { f, sb, score } of final) {
    const set = {};
    const info = [];
    const supId = supByName.get(String(f.supplier).toLowerCase());
    if (!sb.no_faktur) { set.no_faktur = String(f.noFaktur); info.push(`no_faktur=${f.noFaktur}`); }
    if (!sb.supplier_id && supId) { set.supplier_id = supId; info.push(`supplier=${f.supplier}`); }

    // Harga: aplikasi menyimpan harga beli SUDAH + PPN. Kalau harga di DB (x isi per dus)
    // sama dengan harga faktur SEBELUM PPN (toleransi 2%) dan faktur memang belum
    // termasuk PPN -> koreksi ke harga + PPN dan isi ppn_pct. Selain itu tidak ditimpa.
    const spd = sb.spd || 1;
    const hargaLama = parseFloat(sb.harga_beli) || 0;
    let peringatan = null;
    let hargaBaru = null;
    if (f.hargaExcl && f.hargaPlusPpn && f.ppnIncl === 'Tidak') {
      const ppnPct = Math.round((f.hargaPlusPpn / f.hargaExcl - 1) * 100);
      const cocokExcl = hargaLama > 0 && Math.abs(hargaLama * spd - f.hargaExcl) / f.hargaExcl < 0.02;
      if (hargaLama <= 0 || cocokExcl) {
        hargaBaru = parseFloat((f.hargaPlusPpn / spd).toFixed(4));
        set.harga_beli = hargaBaru;
        set.ppn_pct = ppnPct;
        info.push(`harga_beli ${hargaLama} -> ${hargaBaru}, ppn=${ppnPct}%`);
      } else {
        peringatan = `harga DB/dus ${(hargaLama * spd).toFixed(0)} tidak sama dengan faktur ${f.hargaExcl} (sebelum PPN) — tidak ditimpa, cek isi per dus`;
      }
    }
    set.catatan = `${sb.catatan} | Faktur ${f.noFaktur} (${tglStr(f.tanggal)})`;
    if (/Faktur /.test(sb.catatan || '')) { laporan.sudahLengkap++; continue; }
    rencana.push({ f, sb, set, info, peringatan, score, hargaBaru, hargaLama });
  }

  console.log(`Baris faktur di Excel                     : ${faktur.length}`);
  console.log(`Batch cocok persis ke baris Stok Awal     : ${final.length + laporan.ambigu.length + laporan.namaBeda.length}`);
  console.log(`  -> akan dilengkapi                      : ${rencana.length}`);
  console.log(`  -> dilewati, nama obat tidak mirip      : ${laporan.namaBeda.length}`);
  console.log(`  -> dilewati, ambigu                     : ${laporan.ambigu.length}`);
  console.log(`  -> sudah pernah dilengkapi              : ${laporan.sudahLengkap}`);
  console.log(`Batch tidak ketemu (produk lain/baru)     : ${laporan.batchTakKetemu.length}  (tidak disentuh)\n`);

  if (laporan.namaBeda.length) {
    console.log('Dilewati — batch sama tapi nama beda (CEK MANUAL):');
    laporan.namaBeda.forEach((x) => console.log(`  row ${x.f.row} "${x.f.nama}"  vs DB "${x.obat}"  (skor ${x.score.toFixed(2)})`));
    console.log();
  }
  if (laporan.ambigu.length) {
    console.log('Dilewati — ambigu:');
    laporan.ambigu.forEach((x) => console.log(`  row ${x.f.row} "${x.f.nama}" — ${x.alasan}`));
    console.log();
  }
  const ragu = rencana.filter((r) => r.f.keyakinan === 'Ragu');
  if (ragu.length) console.log(`Perhatian: ${ragu.length} baris yang dilengkapi bertanda "Ragu" di Excel (batch/expired pudar): ${ragu.map((r) => 'row ' + r.f.row).join(', ')}\n`);
  const warn = rencana.filter((r) => r.peringatan);
  if (warn.length) {
    console.log('Peringatan harga (tidak ditimpa):');
    warn.forEach((r) => console.log(`  ${r.sb.obat_nama}: ${r.peringatan}`));
    console.log();
  }

  console.log('Rencana perubahan (semua):');
  rencana.forEach((r) => console.log(`  [skor ${r.score.toFixed(2)}] ${r.f.nama}  ->  ${r.sb.obat_nama}  :: ${r.info.join(', ') || '(hanya catatan)'}`));

  if (!COMMIT) {
    console.log('\n' + '='.repeat(70));
    console.log('DRY RUN — tidak ada yang ditulis. obat.stok, jumlah, tanggal TIDAK diubah.');
    console.log('Jalankan ulang dengan --commit untuk menulis.');
    console.log('='.repeat(70));
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS barang_masuk_backup_faktur');
    await client.query('CREATE TABLE barang_masuk_backup_faktur AS SELECT * FROM barang_masuk');
    await client.query('DROP TABLE IF EXISTS obat_backup_faktur');
    await client.query('CREATE TABLE obat_backup_faktur AS SELECT * FROM obat');
    const obatHargaDiubah = [];
    for (const r of rencana) {
      const cols = Object.keys(r.set);
      const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
      await client.query(`UPDATE barang_masuk SET ${sets} WHERE id = $${cols.length + 1}`, [...cols.map((c) => r.set[c]), r.sb.id]);

      // Harga master obat ikut dikoreksi HANYA kalau masih sama dengan harga lama baris ini
      // (artinya belum pernah diedit manual). biaya_simpan diskalakan dengan rasio yang sama
      // supaya persentase biaya simpan (H) tetap.
      if (r.hargaBaru !== null && r.hargaLama > 0) {
        const res = await client.query(
          `UPDATE obat SET harga_beli = $1, biaya_simpan = ROUND(biaya_simpan * $1 / $2, 4), updated_at = NOW()
           WHERE id = $3 AND harga_beli = $2`,
          [r.hargaBaru, r.hargaLama, r.sb.obat_id]
        );
        if (res.rowCount) obatHargaDiubah.push(r.sb.obat_id);
      }
    }
    await client.query('COMMIT');
    console.log(`\n✓ ${rencana.length} baris Stok Awal dilengkapi. Backup: tabel barang_masuk_backup_faktur & obat_backup_faktur.`);

    // Setelah commit: hitung ulang EOQ/ROP obat yang harganya berubah (gagal satu tidak membatalkan data)
    const { hitungUlangObat } = require('../src/services/stokService');
    for (const id of obatHargaDiubah) {
      try { await hitungUlangObat(id); } catch (e) { console.error(`Hitung ulang obat ${id} gagal:`, e.message); }
    }
    console.log(`✓ Harga master + EOQ/ROP diperbarui untuk ${obatHargaDiubah.length} obat.`);
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
