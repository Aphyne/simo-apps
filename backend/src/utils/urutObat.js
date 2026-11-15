// Pembantu SQL untuk GET /obat: urutan dan filter expired.
// Semuanya DAFTAR PUTIH: nilai dari query string tidak pernah disambung ke SQL, hanya dipakai
// untuk memilih salah satu potongan SQL tetap di bawah ini.

// Estimasi hari habis di SQL: harus SAMA dengan hitungEstimasiHabis() di utils/estimasi.js
// (demand kosong/<=0 -> NULL, stok <= 0 -> 0, selain itu dibulatkan ke bawah).
const ESTIMASI_SQL = `(
  CASE
    WHEN o.demand_harian IS NULL OR o.demand_harian <= 0 THEN NULL
    WHEN o.stok <= 0 THEN 0
    ELSE FLOOR(o.stok::numeric / o.demand_harian::numeric)
  END
)`;

const KOLOM_URUT = {
  nama: 'o.nama',
  stok: 'o.stok',
  estimasi: ESTIMASI_SQL,
  expired: 'o.expired_terdekat',
};

// Urutan default tetap nama A-Z. NULL selalu di akhir (obat tanpa estimasi atau tanpa expired tidak
// boleh menutupi yang sungguhan mendesak). o.id sebagai pemutus seri supaya paginasi stabil.
function bangunOrderBy(sort, arah) {
  const kolom = KOLOM_URUT[sort];
  if (!kolom) return 'o.nama ASC, o.id ASC';
  const arahSql = arah === 'desc' ? 'DESC' : 'ASC';
  if (sort === 'nama') return `o.nama ${arahSql}, o.id ASC`;
  return `${kolom} ${arahSql} NULLS LAST, o.nama ASC, o.id ASC`;
}

// Tanggal "hari ini" memakai zona Asia/Jakarta, sama dengan dashboardController.
const HARI_INI_SQL = `(NOW() AT TIME ZONE 'Asia/Jakarta')::date`;

// 'akan'  = expired dalam 0..90 hari (sama dengan angka "akan expired" di dashboard)
// 'lewat' = tanggalnya sudah lewat tetapi batch itu masih punya sisa stok (expired_terdekat = batch FIFO)
const KONDISI_EXPIRED = {
  akan: `(o.expired_terdekat IS NOT NULL AND o.expired_terdekat >= ${HARI_INI_SQL} AND o.expired_terdekat <= ${HARI_INI_SQL} + INTERVAL '90 days')`,
  lewat: `(o.expired_terdekat IS NOT NULL AND o.expired_terdekat < ${HARI_INI_SQL})`,
};

function kondisiExpired(expired) {
  return KONDISI_EXPIRED[expired] || null;
}

module.exports = { bangunOrderBy, kondisiExpired, ESTIMASI_SQL };
