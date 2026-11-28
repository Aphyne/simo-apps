const pool = require('../db/pool');

// Hari apotek = Asia/Jakarta (WIB). Dihitung di SQL supaya hasilnya tidak bergantung pada
// zona waktu server Node maupun server database (Neon berjalan di UTC).
const HARI_INI_WIB = `(NOW() AT TIME ZONE 'Asia/Jakarta')::date`;

// Jendela data permintaan (keputusan Boss 28 Nov 2026):
//   awal  = yang paling akhir di antara tanggal cut-off dan (hari ini − 364 hari)
//   akhir = hari ini (WIB), inklusif
// Sebelum 12 bulan dihitung sejak cut-off, setelahnya 365 hari terakhir. Transaksi sebelum cut-off
// tidak ikut. Cut-off kosong = belum diisi admin → dipakai 365 hari terakhir.
const HARI_MAKS = 365;
const HARI_MINIMAL_CUKUP = 30; // n < 30 → hasil sementara (label di tampilan)

async function ambilJendela(db = pool) {
  const { rows } = await db.query(
    `WITH c AS (
       SELECT CASE WHEN value ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN value::date END AS cutoff
       FROM pengaturan WHERE key = 'tanggal_cutoff'
     ), j AS (
       SELECT (SELECT cutoff FROM c) AS cutoff,
              LEAST(${HARI_INI_WIB},
                    GREATEST(COALESCE((SELECT cutoff FROM c), ${HARI_INI_WIB} - ${HARI_MAKS - 1}),
                             ${HARI_INI_WIB} - ${HARI_MAKS - 1})) AS awal,
              ${HARI_INI_WIB} AS akhir
     )
     SELECT to_char(cutoff, 'YYYY-MM-DD') AS cutoff, to_char(awal, 'YYYY-MM-DD') AS awal,
            to_char(akhir, 'YYYY-MM-DD') AS akhir, (akhir - awal + 1)::int AS n
     FROM j`
  );
  const r = rows[0];
  return {
    cutoff: r.cutoff, // null = belum diisi
    awal: r.awal,
    akhir: r.akhir,
    n: r.n,
    cukup: r.n >= HARI_MINIMAL_CUKUP,
    hari_minimal_cukup: HARI_MINIMAL_CUKUP,
  };
}

// Hitung demand harian dan std deviasi dari penjualan di dalam jendela. Hari tanpa penjualan dihitung 0.
// null = belum bisa dihitung (n < 2 atau tidak ada penjualan di jendela).
async function hitungDemandDariRiwayat(obat_id, jendela) {
  const j = jendela || (await ambilJendela());
  if (j.n < 2) return null; // σ butuh pembagi n − 1

  const { rows } = await pool.query(
    `SELECT h.hari::date AS hari, COALESCE(SUM(bk.jumlah), 0) AS total
     FROM generate_series($2::date::timestamp, $3::date::timestamp, INTERVAL '1 day') AS h(hari)
     LEFT JOIN barang_keluar bk
       ON bk.tanggal = h.hari::date
      AND bk.obat_id = $1
      AND bk.keterangan = 'Penjualan'
     GROUP BY h.hari
     ORDER BY h.hari`,
    [obat_id, j.awal, j.akhir]
  );

  if (!rows.some((r) => parseFloat(r.total) > 0)) return null;

  const harian = rows.map((r) => parseFloat(r.total));
  const n = harian.length;

  const mean = harian.reduce((a, b) => a + b, 0) / n;
  const variance = harian.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  return {
    demand_harian: parseFloat(mean.toFixed(4)),
    std_dev_demand: parseFloat(stdDev.toFixed(4)),
    demand_tahunan: Math.round(mean * 365),
    n_hari: n,
  };
}

// Simpan demand ke tabel obat. Belum bisa dihitung → 0, supaya angka lama (mis. dari penjualan sebelum
// cut-off atau di luar jendela) tidak terus terpakai; EOQ/ROP lalu tampil "belum bisa dihitung".
async function perbaruiDemandObat(obat_id, jendela) {
  const demand = await hitungDemandDariRiwayat(obat_id, jendela);
  const d = demand || { demand_harian: 0, demand_tahunan: 0, std_dev_demand: 0 };
  await pool.query(
    'UPDATE obat SET demand_harian = $1, demand_tahunan = $2, std_dev_demand = $3 WHERE id = $4',
    [d.demand_harian, d.demand_tahunan, d.std_dev_demand, obat_id]
  );
  return demand;
}

module.exports = { ambilJendela, hitungDemandDariRiwayat, perbaruiDemandObat, HARI_MINIMAL_CUKUP };
