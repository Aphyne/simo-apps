const pool = require('../db/pool');

// Hari apotek = Asia/Jakarta (WIB). Dihitung di SQL supaya hasilnya tidak bergantung pada
// zona waktu server Node maupun server database (Neon berjalan di UTC).
const HARI_INI_WIB = `(NOW() AT TIME ZONE 'Asia/Jakarta')::date`;

// Hitung demand harian dan std deviasi dari riwayat penjualan 30 hari terakhir
// (hari ini + 29 hari sebelumnya). Hari tanpa penjualan dihitung 0.
async function hitungDemandDariRiwayat(obat_id) {
  const { rows } = await pool.query(
    `SELECT h.hari::date AS hari, COALESCE(SUM(bk.jumlah), 0) AS total
     FROM generate_series((${HARI_INI_WIB} - 29)::timestamp, ${HARI_INI_WIB}::timestamp, INTERVAL '1 day') AS h(hari)
     LEFT JOIN barang_keluar bk
       ON bk.tanggal = h.hari::date
      AND bk.obat_id = $1
      AND bk.keterangan = 'Penjualan'
     GROUP BY h.hari
     ORDER BY h.hari`,
    [obat_id]
  );

  // Tidak ada satu pun penjualan di jendela 30 hari → demand belum bisa dihitung
  if (!rows.some((r) => parseFloat(r.total) > 0)) return null;

  const harian = rows.map((r) => parseFloat(r.total));
  const n = harian.length; // 30

  const mean = harian.reduce((a, b) => a + b, 0) / n;
  const variance = harian.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  return {
    demand_harian: parseFloat(mean.toFixed(4)),
    std_dev_demand: parseFloat(stdDev.toFixed(4)),
    demand_tahunan: Math.round(mean * 365),
  };
}

module.exports = { hitungDemandDariRiwayat };
