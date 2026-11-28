const pool = require('../db/pool');
const { BATAS_KUNING_SQL } = require('./obatController');

// Perkiraan sisa stok per batch (FIFO menurut tanggal kedaluwarsa: yang paling cepat expired dianggap keluar lebih dulu).
// Baris "Riwayat faktur" tidak punya batch dan tidak menambah stok, jadi dikecualikan. Dipakai daftar "akan expired" dan "sudah lewat".
const BATCH_CTE = `
  batch_masuk AS (
    SELECT obat_id, expired_batch,
      STRING_AGG(DISTINCT no_batch, ', ') FILTER (WHERE no_batch IS NOT NULL) AS no_batch,
      SUM(jumlah_satuan)::int AS total_masuk
    FROM barang_masuk
    WHERE expired_batch IS NOT NULL
      AND (catatan IS NULL OR catatan NOT LIKE 'Riwayat faktur%')
    GROUP BY obat_id, expired_batch
  ),
  total_keluar AS (
    SELECT obat_id,
      COALESCE(SUM(jumlah), 0)::int AS total_keluar
    FROM barang_keluar
    GROUP BY obat_id
  ),
  batch_calc AS (
    SELECT
      bm.obat_id, bm.expired_batch, bm.no_batch, bm.total_masuk,
      GREATEST(0,
        bm.total_masuk - GREATEST(0,
          COALESCE(tk.total_keluar, 0) -
          COALESCE(SUM(bm.total_masuk) OVER (
            PARTITION BY bm.obat_id ORDER BY bm.expired_batch
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
          ), 0)
        )
      ) AS estimasi_sisa
    FROM batch_masuk bm
    LEFT JOIN total_keluar tk ON tk.obat_id = bm.obat_id
  )`;

async function getSummary(req, res) {
  try {
    // Angka uang (pendapatan, harga, terlaris, kelengkapan harga) hanya untuk admin; staf tidak menerimanya sama sekali.
    const isAdmin = req.user?.role === 'admin';
    const [
      totalObat,
      obatReorder,
      nilaiStok,
      transaksiHariIni,
      pendapatanHariIni,
      obatExpiring,
      obatMendesak,
      daftarExpired,
      stokMenipis,
      obatSegera,
      daftarLewat,
      terlaris,
      perluDilengkapi,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM obat'),
      // rop > 0: ROP=0 berarti belum ada histori demand (belum valid dihitung),
      // bukan ambang reorder di titik 0 unit — jangan ikut dihitung "perlu reorder".
      // ROP dibandingkan setelah dibulatkan ke atas (CEIL), sama dengan status di obatController.
      pool.query('SELECT COUNT(*) FROM obat WHERE rop IS NOT NULL AND rop > 0 AND stok <= CEIL(rop)'),
      pool.query(`SELECT COALESCE(SUM(jumlah), 0) AS total FROM barang_keluar WHERE keterangan = 'Penjualan' AND tanggal = (NOW() AT TIME ZONE 'Asia/Jakarta')::date`),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM barang_masuk WHERE tanggal = (NOW() AT TIME ZONE 'Asia/Jakarta')::date) AS masuk,
          (SELECT COUNT(*) FROM barang_keluar WHERE tanggal = (NOW() AT TIME ZONE 'Asia/Jakarta')::date) AS keluar
      `),
      // Pendapatan = jumlah x harga_jual yang tercatat saat penjualan. Baris tanpa harga (data lama)
      // dihitung terpisah supaya tampilan tidak menyiratkan Rp 0 yang keliru.
      pool.query(`
        SELECT COALESCE(SUM(jumlah * harga_jual), 0) AS total,
               COUNT(*) AS transaksi,
               COUNT(*) FILTER (WHERE harga_jual IS NULL OR harga_jual = 0) AS tanpa_harga
        FROM barang_keluar
        WHERE keterangan = 'Penjualan' AND tanggal = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
      `),
      pool.query(`
        SELECT COUNT(*) FROM obat
        WHERE expired_terdekat IS NOT NULL
          AND expired_terdekat >= (NOW() AT TIME ZONE 'Asia/Jakarta')::date
          AND expired_terdekat <= (NOW() AT TIME ZONE 'Asia/Jakarta')::date + INTERVAL '90 days'
      `),
      pool.query(`
        SELECT id, kode, nama, satuan, stok, CEIL(rop) AS rop, CEIL(eoq) AS eoq, safety_stock,
               (stok - CEIL(rop)) AS selisih
        FROM obat
        WHERE rop IS NOT NULL AND rop > 0 AND stok <= CEIL(rop)
        ORDER BY (stok - CEIL(rop)) ASC
        LIMIT 5
      `),
      pool.query(`
        WITH ${BATCH_CTE},
        nearest_batch AS (
          SELECT DISTINCT ON (obat_id)
            obat_id, expired_batch, no_batch, estimasi_sisa
          FROM batch_calc
          WHERE expired_batch >= (NOW() AT TIME ZONE 'Asia/Jakarta')::date AND estimasi_sisa > 0
          ORDER BY obat_id, expired_batch ASC
        )
        SELECT
          o.id,
          o.kode,
          o.nama,
          o.satuan,
          nb.no_batch,
          COALESCE(nb.estimasi_sisa, o.stok) AS stok,
          COALESCE(nb.expired_batch, o.expired_terdekat) AS expired_terdekat
        FROM obat o
        LEFT JOIN nearest_batch nb ON nb.obat_id = o.id
        WHERE (
          nb.obat_id IS NOT NULL
          OR (o.expired_terdekat IS NOT NULL AND o.expired_terdekat >= (NOW() AT TIME ZONE 'Asia/Jakarta')::date)
        )
          AND COALESCE(nb.expired_batch, o.expired_terdekat) <= (NOW() AT TIME ZONE 'Asia/Jakarta')::date + INTERVAL '90 days'
        ORDER BY COALESCE(nb.expired_batch, o.expired_terdekat) ASC
        LIMIT 30
      `),
      pool.query(`
        SELECT o.id, o.kode, o.nama, o.satuan, o.stok, CEIL(o.rop) AS rop, CEIL(o.eoq) AS eoq,
               (o.stok - CEIL(o.rop)) AS selisih
        FROM obat o
        WHERE o.rop IS NOT NULL AND o.rop > 0 AND o.stok <= ${BATAS_KUNING_SQL}
        ORDER BY (o.stok::float / NULLIF(CEIL(o.rop), 0)) ASC
        LIMIT 5
      `),
      // Habis dalam 7 hari = belum habis, tetapi stok dibagi kebutuhan harian <= 7 hari, di antara obat yang perlu reorder
      // (aturan yang sama dengan ubin "Habis dalam 7 hari" di halaman Reorder, supaya tautan ?kondisi=segera cocok).
      pool.query(`
        SELECT COUNT(*) FROM obat
        WHERE rop IS NOT NULL AND rop > 0 AND stok <= CEIL(rop)
          AND stok > 0 AND demand_harian > 0 AND stok / demand_harian <= 7
      `),
      // Sudah lewat tanggal tetapi masih tercatat berstok: satu baris per BATCH (perkiraan FIFO, dibatasi stok obat sekarang),
      // supaya jelas batch mana yang harus ditarik dari rak. "total" = jumlah batch, bukan jumlah obat.
      pool.query(`
        WITH ${BATCH_CTE}
        SELECT o.id, o.kode, o.nama, o.satuan, bc.no_batch,
               LEAST(bc.estimasi_sisa, o.stok)::int AS stok,
               bc.expired_batch AS expired_terdekat,
               COUNT(*) OVER () AS total
        FROM batch_calc bc
        JOIN obat o ON o.id = bc.obat_id
        WHERE bc.expired_batch < (NOW() AT TIME ZONE 'Asia/Jakarta')::date
          AND bc.estimasi_sisa > 0
          AND o.stok > 0
        ORDER BY bc.expired_batch ASC, o.nama ASC
        LIMIT 30
      `),
      // Terlaris 30 hari terakhir menurut pendapatan (Rp sepadan lintas satuan; jendela bergulir supaya tidak kosong di awal bulan).
      // Penjualan tanpa harga tidak ikut. Hanya admin.
      isAdmin
        ? pool.query(`
            SELECT o.id, o.nama, o.satuan,
                   SUM(bk.jumlah)::int AS jumlah,
                   SUM(bk.jumlah * bk.harga_jual) AS pendapatan
            FROM barang_keluar bk
            JOIN obat o ON o.id = bk.obat_id
            WHERE bk.keterangan = 'Penjualan'
              AND bk.harga_jual > 0
              AND bk.tanggal >= (NOW() AT TIME ZONE 'Asia/Jakarta')::date - 29
            GROUP BY o.id, o.nama, o.satuan
            ORDER BY pendapatan DESC
            LIMIT 10
          `)
        : Promise.resolve({ rows: [] }),
      // Data yang belum lengkap dan membuat angka Rupiah kurang akurat. Hanya admin.
      isAdmin
        ? pool.query(`
            SELECT
              (SELECT COUNT(*) FROM barang_keluar
                WHERE keterangan = 'Penjualan' AND (harga_jual IS NULL OR harga_jual = 0)) AS penjualan_tanpa_harga,
              (SELECT COUNT(*) FROM obat WHERE supplier_id IS NULL) AS obat_tanpa_supplier,
              (SELECT COUNT(*) FROM barang_masuk
                WHERE expired_batch IS NOT NULL AND no_batch IS NULL
                  AND (catatan IS NULL OR catatan NOT LIKE 'Riwayat faktur%')) AS batch_tanpa_nomor
          `)
        : Promise.resolve({ rows: [] }),
    ]);

    res.json({
      success: true,
      data: {
        cards: {
          total_obat: parseInt(totalObat.rows[0].count),
          obat_reorder: parseInt(obatReorder.rows[0].count),
          penjualan_hari_ini: parseInt(nilaiStok.rows[0].total),
          transaksi_hari_ini: parseInt(transaksiHariIni.rows[0].masuk) + parseInt(transaksiHariIni.rows[0].keluar),
          masuk_hari_ini: parseInt(transaksiHariIni.rows[0].masuk),
          keluar_hari_ini: parseInt(transaksiHariIni.rows[0].keluar),
          obat_expiring: parseInt(obatExpiring.rows[0].count),
          obat_segera_habis: parseInt(obatSegera.rows[0].count),
          kedaluwarsa_lewat: daftarLewat.rows.length ? parseInt(daftarLewat.rows[0].total) : 0,
          ...(isAdmin
            ? {
                pendapatan_hari_ini: Math.round(parseFloat(pendapatanHariIni.rows[0].total)),
                penjualan_tanpa_harga: parseInt(pendapatanHariIni.rows[0].tanpa_harga),
                penjualan_transaksi: parseInt(pendapatanHariIni.rows[0].transaksi),
              }
            : {}),
        },
        obat_mendesak: obatMendesak.rows,
        daftar_expired: daftarExpired.rows,
        total_urgent: parseInt(obatExpiring.rows[0].count),
        stok_menipis: stokMenipis.rows,
        daftar_lewat: daftarLewat.rows.map(({ total, ...r }) => r),
        terlaris_30_hari: terlaris.rows.map((r) => ({ ...r, pendapatan: Math.round(parseFloat(r.pendapatan)) })),
        perlu_dilengkapi: isAdmin && perluDilengkapi.rows.length
          ? {
              penjualan_tanpa_harga: parseInt(perluDilengkapi.rows[0].penjualan_tanpa_harga),
              obat_tanpa_supplier: parseInt(perluDilengkapi.rows[0].obat_tanpa_supplier),
              batch_tanpa_nomor: parseInt(perluDilengkapi.rows[0].batch_tanpa_nomor),
            }
          : null,
      },
    });
  } catch (err) {
    console.error('dashboard.getSummary:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getTrenPermintaan(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('month', tanggal) AS bulan,
        SUM(jumlah) AS total
      FROM barang_keluar
      WHERE keterangan = 'Penjualan'
        AND tanggal >= DATE_TRUNC('month', (NOW() AT TIME ZONE 'Asia/Jakarta')::date) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', tanggal)
      ORDER BY bulan ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('dashboard.getTrenPermintaan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Pembelian (stok masuk x harga beli per satuan, sudah termasuk diskon dan PPN) dibanding penjualan (hanya keterangan
// Penjualan x harga jual), per bulan selama 6 bulan. Dalam Rupiah supaya sepadan lintas satuan obat. Baris "Stok Awal"
// (stok pembuka saat obat didaftarkan) bukan pembelian, jadi dikecualikan. Penjualan lama tanpa harga dihitung terpisah.
async function getPembelianPenjualan(req, res) {
  try {
    const { rows } = await pool.query(`
      WITH awal AS (
        SELECT DATE_TRUNC('month', (NOW() AT TIME ZONE 'Asia/Jakarta')::date) - INTERVAL '5 months' AS dari
      ),
      bulan AS (
        SELECT GENERATE_SERIES(awal.dari, awal.dari + INTERVAL '5 months', INTERVAL '1 month') AS b FROM awal
      ),
      pembelian AS (
        SELECT DATE_TRUNC('month', bm.tanggal) AS b, SUM(bm.jumlah_satuan * bm.harga_beli) AS total
        FROM barang_masuk bm, awal
        WHERE bm.harga_beli IS NOT NULL
          AND (bm.catatan IS NULL OR bm.catatan <> 'Stok Awal')
          AND bm.tanggal >= awal.dari
        GROUP BY 1
      ),
      penjualan AS (
        SELECT DATE_TRUNC('month', bk.tanggal) AS b,
               SUM(bk.jumlah * COALESCE(bk.harga_jual, 0)) AS total,
               COUNT(*) FILTER (WHERE bk.harga_jual IS NULL OR bk.harga_jual = 0) AS tanpa_harga
        FROM barang_keluar bk, awal
        WHERE bk.keterangan = 'Penjualan' AND bk.tanggal >= awal.dari
        GROUP BY 1
      )
      SELECT TO_CHAR(bulan.b, 'YYYY-MM-DD') AS bulan,
             COALESCE(pembelian.total, 0) AS pembelian,
             COALESCE(penjualan.total, 0) AS penjualan,
             COALESCE(penjualan.tanpa_harga, 0) AS penjualan_tanpa_harga
      FROM bulan
      LEFT JOIN pembelian ON pembelian.b = bulan.b
      LEFT JOIN penjualan ON penjualan.b = bulan.b
      ORDER BY bulan.b ASC
    `);
    res.json({
      success: true,
      data: rows.map((r) => ({
        bulan: r.bulan,
        pembelian: Math.round(parseFloat(r.pembelian)),
        penjualan: Math.round(parseFloat(r.penjualan)),
        penjualan_tanpa_harga: parseInt(r.penjualan_tanpa_harga),
      })),
    });
  } catch (err) {
    console.error('dashboard.getPembelianPenjualan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getPerbandinganBiaya(req, res) {
  try {
    const asumsiRows = await pool.query(
      `SELECT value FROM pengaturan WHERE key = 'asumsi_dus_tradisional'`
    );
    const asumsiParsed = parseFloat(asumsiRows.rows[0]?.value);
    // Sama seperti analisisController — Q tradisional = asumsi (default 2 dus) × isi per dus,
    // bukan lagi selalu 1 dus. Lihat docs/08-development-roadmap.md Fase 6 "Revisi Q Tradisional".
    const asumsiDus = Number.isFinite(asumsiParsed) && asumsiParsed > 0 ? asumsiParsed : 2;

    const { rows } = await pool.query(`
      SELECT
        id, nama, satuan,
        demand_tahunan, biaya_pesan, biaya_simpan,
        satuan_per_dus, eoq, total_biaya
      FROM obat
      WHERE total_biaya IS NOT NULL
        AND biaya_pesan > 0
        AND biaya_simpan > 0
        AND demand_tahunan > 0
        AND satuan_per_dus > 0
      ORDER BY total_biaya DESC
      LIMIT 8
    `);

    const data = rows.map((o) => {
      const D = parseFloat(o.demand_tahunan);
      const S = parseFloat(o.biaya_pesan);
      const H = parseFloat(o.biaya_simpan);
      const Q_trad = asumsiDus * parseFloat(o.satuan_per_dus);
      const tc_tanpa_eoq = (D / Q_trad) * S + (Q_trad / 2) * H;

      return {
        id: o.id,
        nama: o.nama.length > 15 ? o.nama.substring(0, 15) + '…' : o.nama,
        nama_lengkap: o.nama,
        biaya_eoq: parseFloat(parseFloat(o.total_biaya).toFixed(0)),
        biaya_tanpa_eoq: parseFloat(tc_tanpa_eoq.toFixed(0)),
        penghematan: parseFloat((tc_tanpa_eoq - parseFloat(o.total_biaya)).toFixed(0)),
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('dashboard.getPerbandinganBiaya:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getSummary, getTrenPermintaan, getPerbandinganBiaya, getPembelianPenjualan };
