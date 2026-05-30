/**
 * Script sekali jalan: sinkronisasi expired_terdekat & supplier_id
 * di tabel obat dari data barang_masuk yang sudah ada.
 *
 * Jalankan dari folder /backend:
 *   node scripts/fix-obat-expired-supplier.js
 */

require('dotenv').config();
const pool = require('../src/db/pool');

async function run() {
  console.log('Menghubungkan ke database...');

  try {
    // ── 1. Update expired_terdekat → ambil MIN dari semua barang masuk ──────
    const { rowCount: r1 } = await pool.query(`
      UPDATE obat o
      SET    expired_terdekat = sub.min_expired,
             updated_at       = NOW()
      FROM (
        SELECT   obat_id,
                 MIN(expired_batch) AS min_expired
        FROM     barang_masuk
        WHERE    expired_batch IS NOT NULL
        GROUP BY obat_id
      ) sub
      WHERE o.id = sub.obat_id
    `);
    console.log(`✅ expired_terdekat diupdate: ${r1} obat`);

    // ── 2. Update supplier_id → ambil dari barang masuk paling terbaru ──────
    const { rowCount: r2 } = await pool.query(`
      UPDATE obat o
      SET    supplier_id  = sub.supplier_id,
             updated_at   = NOW()
      FROM (
        SELECT DISTINCT ON (obat_id)
               obat_id,
               supplier_id
        FROM   barang_masuk
        WHERE  supplier_id IS NOT NULL
        ORDER  BY obat_id, created_at DESC
      ) sub
      WHERE o.id          = sub.obat_id
        AND sub.supplier_id IS NOT NULL
    `);
    console.log(`✅ supplier_id diupdate: ${r2} obat`);

    console.log('\nSelesai. Refresh halaman Data Obat untuk melihat hasilnya.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
