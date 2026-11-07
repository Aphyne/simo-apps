/**
 * Script sekali jalan: hapus obat yang belum "lengkap" — didefinisikan sebagai
 * obat yang TIDAK punya transaksi barang_masuk tercatat (artinya belum pernah
 * ada data batch/stok nyata yang masuk lewat impor atau pencatatan manual).
 *
 * Dipakai setelah import-data-obat.js untuk membersihkan data master "kosong"
 * (nama/kategori/harga jual saja, stok=0) yang menunggu dilengkapi dari apotek,
 * supaya database Data Obat cuma berisi obat yang benar-benar siap dipakai.
 *
 * Mode default = DRY RUN: hanya mencetak apa yang akan dihapus.
 * Jalankan dengan --commit untuk benar-benar menghapus.
 *
 * Jalankan dari folder /backend:
 *   node scripts/clear-incomplete-obat.js             (dry-run)
 *   node scripts/clear-incomplete-obat.js --commit     (hapus sungguhan)
 */

require('dotenv').config();
const pool = require('../src/db/pool');

const COMMIT = process.argv.includes('--commit');

async function main() {
  console.log(`Mode: ${COMMIT ? 'COMMIT (akan menghapus data)' : 'DRY RUN (tidak menghapus apa pun)'}\n`);

  const client = await pool.connect();
  try {
    const { rows: target } = await client.query(`
      SELECT id, kode, nama, stok, harga_beli
      FROM obat
      WHERE id NOT IN (SELECT DISTINCT obat_id FROM barang_masuk)
      ORDER BY kode
    `);

    const { rows: sisaCount } = await client.query(`
      SELECT COUNT(*) FROM obat WHERE id IN (SELECT DISTINCT obat_id FROM barang_masuk)
    `);

    console.log(`Obat TANPA transaksi barang_masuk (akan dihapus): ${target.length}`);
    console.log(`Obat DENGAN transaksi barang_masuk (akan tersisa): ${sisaCount[0].count}`);

    // Sanity check: pastikan tidak ada barang_keluar yang akan jadi orphan
    const { rows: bkCheck } = await client.query(`
      SELECT COUNT(*) FROM barang_keluar WHERE obat_id = ANY($1::int[])
    `, [target.map((o) => o.id)]);
    if (parseInt(bkCheck[0].count) > 0) {
      console.log(`\n⚠️  PERINGATAN: ${bkCheck[0].count} baris barang_keluar terhubung ke obat yang akan dihapus.`);
      console.log('   Dibatalkan — hapus transaksi itu dulu secara manual sebelum menjalankan ulang.');
      return;
    }

    if (!COMMIT) {
      console.log('\nContoh 10 obat yang akan dihapus:');
      target.slice(0, 10).forEach((o) => console.log(`  ${o.kode} — ${o.nama} (stok=${o.stok}, harga_beli=${o.harga_beli})`));
      if (target.length > 10) console.log(`  ... dan ${target.length - 10} obat lainnya`);
      console.log('\nIni DRY RUN — tidak ada yang dihapus. Jalankan ulang dengan --commit untuk benar-benar menghapus.');
      return;
    }

    await client.query('BEGIN');
    const ids = target.map((o) => o.id);
    await client.query('DELETE FROM obat WHERE id = ANY($1::int[])', [ids]);
    await client.query('COMMIT');

    console.log(`\n✓ Selesai — ${target.length} obat tanpa transaksi barang_masuk sudah dihapus.`);
    console.log(`  Sisa ${sisaCount[0].count} obat yang lengkap.`);
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
