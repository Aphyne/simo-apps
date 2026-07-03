const pool = require('../db/pool');
const { kalkulasiLengkap } = require('./eoqService');

// Hitung ulang EOQ/SS/ROP untuk satu obat dan simpan ke DB
async function hitungUlangObat(obat_id) {
  const { rows } = await pool.query(
    `SELECT o.*, s.lead_time_avg AS s_lead_time, s.biaya_pesan AS s_biaya_pesan
     FROM obat o
     LEFT JOIN supplier s ON o.supplier_id = s.id
     WHERE o.id = $1`,
    [obat_id]
  );
  if (!rows.length) throw new Error('Obat tidak ditemukan');

  const obat = rows[0];
  const obatForCalc = {
    ...obat,
    lead_time: obat.s_lead_time ?? obat.lead_time ?? 1,
  };
  const hasil = kalkulasiLengkap(obatForCalc);

  const { rows: updated } = await pool.query(
    `UPDATE obat
     SET eoq = $1, safety_stock = $2, rop = $3, total_biaya = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [hasil.eoq, hasil.safety_stock, hasil.rop, hasil.total_biaya, obat_id]
  );

  return updated[0];
}

// Update expired_terdekat → batch terdekat yang masih punya estimasi sisa (FIFO)
async function updateExpiredTerdekat(obat_id) {
  await pool.query(
    `UPDATE obat
     SET expired_terdekat = (
       WITH bm AS (
         SELECT expired_batch, SUM(jumlah_satuan)::int AS total_masuk
         FROM barang_masuk
         WHERE obat_id = $1 AND expired_batch IS NOT NULL
         GROUP BY expired_batch
       ),
       tk AS (
         SELECT COALESCE(SUM(jumlah), 0)::int AS total_keluar
         FROM barang_keluar WHERE obat_id = $1
       ),
       calc AS (
         SELECT expired_batch,
           GREATEST(0,
             total_masuk - GREATEST(0,
               (SELECT total_keluar FROM tk) -
               COALESCE(SUM(total_masuk) OVER (
                 ORDER BY expired_batch
                 ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
               ), 0)
             )
           ) AS estimasi_sisa
         FROM bm
       )
       SELECT MIN(expired_batch) FROM calc WHERE estimasi_sisa > 0
     ),
     updated_at = NOW()
     WHERE id = $1`,
    [obat_id]
  );
}

module.exports = { hitungUlangObat, updateExpiredTerdekat };
