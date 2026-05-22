const pool = require('../db/pool');

// Hitung demand harian dan std deviasi dari riwayat penjualan 30 hari terakhir
async function hitungDemandDariRiwayat(obat_id) {
  const { rows } = await pool.query(
    `SELECT tanggal, SUM(jumlah) AS total
     FROM barang_keluar
     WHERE obat_id = $1
       AND keterangan = 'Penjualan'
       AND tanggal >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY tanggal`,
    [obat_id]
  );

  if (rows.length === 0) return null;

  // Buat array 30 hari, hari tanpa penjualan = 0
  const harian = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = rows.find((r) => {
      const rowDate = r.tanggal instanceof Date
        ? r.tanggal.toISOString().split('T')[0]
        : String(r.tanggal).split('T')[0];
      return rowDate === dateStr;
    });
    harian.push(found ? parseFloat(found.total) : 0);
  }

  const mean = harian.reduce((a, b) => a + b, 0) / 30;
  const variance = harian.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (30 - 1);
  const stdDev = Math.sqrt(variance);

  return {
    demand_harian: parseFloat(mean.toFixed(4)),
    std_dev_demand: parseFloat(stdDev.toFixed(4)),
    demand_tahunan: Math.round(mean * 365),
  };
}

module.exports = { hitungDemandDariRiwayat };
