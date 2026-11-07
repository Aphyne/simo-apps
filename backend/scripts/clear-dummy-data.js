/**
 * Script sekali jalan: hapus SEMUA data dummy di tabel obat, barang_masuk,
 * barang_keluar, dan supplier — persiapan sebelum impor data_obat_aptl_Rezky.xlsx.
 *
 * TIDAK menyentuh tabel users dan pengaturan.
 *
 * Mode default = DRY RUN: hanya mencetak apa yang akan dihapus.
 * Jalankan dengan --commit untuk benar-benar menghapus.
 *
 * Jalankan dari folder /backend:
 *   node scripts/clear-dummy-data.js             (dry-run)
 *   node scripts/clear-dummy-data.js --commit     (hapus sungguhan)
 */

require('dotenv').config();
const pool = require('../src/db/pool');

const COMMIT = process.argv.includes('--commit');

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT (akan menghapus data)' : 'DRY RUN (tidak menghapus apa pun)'}\n`);

  const client = await pool.connect();
  try {
    const counts = {};
    for (const table of ['obat', 'barang_masuk', 'barang_keluar', 'supplier', 'simulasi_skenario']) {
      try {
        const { rows } = await client.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(rows[0].count);
      } catch {
        counts[table] = null; // tabel tidak ada (misal simulasi_skenario sudah di-drop)
      }
    }

    console.log('Akan dihapus:');
    console.log(`  obat:              ${counts.obat}`);
    console.log(`  barang_masuk:      ${counts.barang_masuk}`);
    console.log(`  barang_keluar:     ${counts.barang_keluar}`);
    console.log(`  supplier:          ${counts.supplier}`);
    if (counts.simulasi_skenario !== null) {
      console.log(`  simulasi_skenario: ${counts.simulasi_skenario} (CASCADE otomatis dari obat)`);
    }
    console.log('\nTIDAK disentuh: users, pengaturan.\n');

    if (!COMMIT) {
      console.log('Ini DRY RUN — tidak ada yang dihapus. Jalankan ulang dengan --commit untuk benar-benar menghapus.');
      return;
    }

    await client.query('BEGIN');
    // Urutan wajib: barang_keluar & barang_masuk dulu (FK RESTRICT ke obat),
    // baru obat, baru supplier (FK dari obat.supplier_id sudah SET NULL otomatis).
    await client.query('DELETE FROM barang_keluar');
    await client.query('DELETE FROM barang_masuk');
    await client.query('DELETE FROM obat');
    await client.query('DELETE FROM supplier');
    // Reset sequence supaya kode obat/id mulai dari awal lagi (OBT-001, dst)
    await client.query('ALTER SEQUENCE obat_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE barang_masuk_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE barang_keluar_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE supplier_id_seq RESTART WITH 1');
    await client.query('COMMIT');

    console.log('✓ Selesai — obat, barang_masuk, barang_keluar, dan supplier sudah dikosongkan.');
  } catch (err) {
    if (COMMIT) await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Gagal:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
