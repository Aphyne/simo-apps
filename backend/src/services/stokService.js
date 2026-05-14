const pool = require('../db/pool');
const { kalkulasiLengkap } = require('./eoqService');

// Hitung ulang EOQ/SS/ROP untuk satu obat dan simpan ke DB
async function hitungUlangObat(obat_id) {
  const { rows } = await pool.query('SELECT * FROM obat WHERE id = $1', [obat_id]);
  if (!rows.length) throw new Error('Obat tidak ditemukan');

  const obat = rows[0];
  const hasil = kalkulasiLengkap(obat);

  const { rows: updated } = await pool.query(
    `UPDATE obat
     SET eoq = $1, safety_stock = $2, rop = $3, total_biaya = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [hasil.eoq, hasil.safety_stock, hasil.rop, hasil.total_biaya, obat_id]
  );

  return updated[0];
}

module.exports = { hitungUlangObat };
