/**
 * Script sekali jalan: hitung ulang demand_harian/std_dev_demand/demand_tahunan
 * + EOQ/ROP untuk SEMUA obat yang punya histori barang_keluar (keterangan
 * 'Penjualan'), dari rentang tanggal transaksi itu sendiri — bukan window
 * "30 hari dari hari ini" (lihat catatan di import-penjualan-oktober.js).
 *
 * Dipakai untuk memperbaiki obat yang sudah terlanjur dapat transaksi
 * Penjualan tapi demand_harian-nya masih 0 (commit sebelum perbaikan ini ada).
 *
 * Jalankan dari folder /backend:
 *   node scripts/hitung-ulang-demand.js
 */

require('dotenv').config();
const pool = require('../src/db/pool');
const { hitungUlangObat, updateExpiredTerdekat } = require('../src/services/stokService');

async function main() {
  const { rows: obatIds } = await pool.query(
    `SELECT DISTINCT obat_id FROM barang_keluar WHERE keterangan = 'Penjualan'`
  );
  console.log(`Obat dengan histori Penjualan: ${obatIds.length}`);

  let sukses = 0;
  for (const { obat_id: obatId } of obatIds) {
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
      const hasil = await hitungUlangObat(obatId);

      console.log(`✓ obat ${obatId} "${hasil.nama}": demand_harian=${mean.toFixed(2)} eoq=${hasil.eoq} rop=${hasil.rop}`);
      sukses++;
    } catch (err) {
      console.error(`Gagal obat ${obatId}:`, err.message);
    }
  }

  console.log(`\n✓ Selesai — ${sukses}/${obatIds.length} obat diperbarui.`);
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
