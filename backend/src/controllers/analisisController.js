const pool = require('../db/pool');

async function getAsumsiDusTradisional() {
  const { rows } = await pool.query(
    `SELECT value FROM pengaturan WHERE key = 'asumsi_dus_tradisional'`
  );
  const nilai = parseFloat(rows[0]?.value);
  // Fallback 2 kalau setting belum ada di database (mis. migration belum jalan)
  return Number.isFinite(nilai) && nilai > 0 ? nilai : 2;
}

async function getPerbandingan(req, res) {
  try {
    const asumsiDus = await getAsumsiDusTradisional();

    // Semua obat diambil supaya halaman bisa menyebut berapa yang TIDAK ikut dihitung dan kenapa
    // (alasan ditentukan berurutan, jadi tiap obat hanya masuk satu alasan).
    const { rows: semua } = await pool.query(`
      SELECT id, kode, nama, satuan,
             demand_tahunan, biaya_pesan, biaya_simpan, satuan_per_dus, eoq
      FROM obat
      ORDER BY nama ASC
    `);

    const tidakDihitung = { tanpa_biaya_pesan: 0, tanpa_biaya_simpan: 0, tanpa_demand: 0, tanpa_isi_dus: 0 };
    let eoqTersimpanBeda = 0;
    const detail = [];

    for (const o of semua) {
      const D = parseFloat(o.demand_tahunan) || 0;
      const S = parseFloat(o.biaya_pesan) || 0;
      const H = parseFloat(o.biaya_simpan) || 0;
      const isi = parseFloat(o.satuan_per_dus) || 0;

      if (S <= 0) { tidakDihitung.tanpa_biaya_pesan++; continue; }
      if (H <= 0) { tidakDihitung.tanpa_biaya_simpan++; continue; }
      if (D <= 0) { tidakDihitung.tanpa_demand++; continue; }
      if (isi <= 0) { tidakDihitung.tanpa_isi_dus++; continue; }

      // Kedua skenario dihitung dari D, S, H yang SAMA dan rumus yang sama: TC = (D/Q × S) + (Q/2 × H).
      // Sebelumnya biaya "dengan EOQ" memakai total_biaya tersimpan (hasil hitung ulang terakhir) sedangkan biaya
      // "sebelum EOQ" dihitung dari data sekarang; bila keduanya beda waktu hitung, selisihnya tidak sepadan.
      // Q tradisional = asumsi jumlah dus per pemesanan (setting, default 2) × isi per dus.
      // Bukan dihitung dari riwayat barang_masuk — lihat docs/08-development-roadmap.md Fase 6 "Revisi Q Tradisional".
      const Q_trad = asumsiDus * isi;
      const Q_eoq = Math.sqrt((2 * D * S) / H);

      // Komponen dibulatkan ke rupiah, total = jumlah komponen yang tampil, supaya angka di tabel dan di rincian
      // selalu cocok dijumlahkan (penting untuk lampiran skripsi).
      const bp_trad = Math.round((D / Q_trad) * S);
      const bs_trad = Math.round((Q_trad / 2) * H);
      const bp_eoq = Math.round((D / Q_eoq) * S);
      const bs_eoq = Math.round((Q_eoq / 2) * H);
      const tc_tradisional = bp_trad + bs_trad;
      const tc_eoq = bp_eoq + bs_eoq;
      const penghematan = tc_tradisional - tc_eoq;
      const persen_hemat = tc_tradisional > 0 ? (penghematan / tc_tradisional) * 100 : 0;

      // EOQ yang tersimpan di data obat (dipakai halaman lain) harus sama dengan hitungan sekarang; bila beda,
      // obat itu perlu "hitung ulang" sebelum angka dipakai.
      const eoqTersimpan = o.eoq === null ? null : parseFloat(o.eoq);
      if (eoqTersimpan === null || Math.abs(eoqTersimpan - Q_eoq) / Q_eoq > 0.01) eoqTersimpanBeda++;

      detail.push({
        id: o.id,
        kode: o.kode,
        nama: o.nama,
        satuan: o.satuan,
        satuan_per_dus: isi,
        demand_tahunan: Math.round(D),
        biaya_pesan: S,
        biaya_simpan: H,
        asumsi_dus: asumsiDus,
        q_tradisional: Q_trad,
        q_eoq: Math.round(Q_eoq),
        q_eoq_dus: parseFloat((Q_eoq / isi).toFixed(2)),
        frek_tradisional: parseFloat((D / Q_trad).toFixed(2)),
        frek_eoq: parseFloat((D / Q_eoq).toFixed(2)),
        bp_tradisional: bp_trad,
        bs_tradisional: bs_trad,
        bp_eoq,
        bs_eoq,
        tc_tradisional,
        tc_eoq,
        penghematan,
        persen_hemat: parseFloat(persen_hemat.toFixed(1)),
      });
    }

    const jumlah = (f) => detail.reduce((s, d) => s + d[f], 0);
    const total_tc_trad = jumlah('tc_tradisional');
    const total_tc_eoq = jumlah('tc_eoq');
    const total_penghematan = total_tc_trad - total_tc_eoq;
    const persen_hemat_total =
      total_tc_trad > 0
        ? parseFloat(((total_penghematan / total_tc_trad) * 100).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        ringkasan: {
          total_obat: semua.length,
          total_obat_dihitung: detail.length,
          tidak_dihitung: tidakDihitung,
          eoq_tersimpan_beda: eoqTersimpanBeda,
          total_tc_tradisional: total_tc_trad,
          total_tc_eoq,
          total_bp_tradisional: jumlah('bp_tradisional'),
          total_bs_tradisional: jumlah('bs_tradisional'),
          total_bp_eoq: jumlah('bp_eoq'),
          total_bs_eoq: jumlah('bs_eoq'),
          total_penghematan,
          persen_hemat_total,
          asumsi_dus_tradisional: asumsiDus,
        },
        detail,
      },
    });
  } catch (err) {
    console.error('analisis.getPerbandingan:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Kondisi sesudah = current state (EOQ-based)
async function getKondisiSesudah(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id, kode, nama, satuan, stok,
             eoq, safety_stock, rop, total_biaya,
             demand_harian, demand_tahunan
      FROM obat
      WHERE eoq IS NOT NULL
      ORDER BY nama ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('analisis.getKondisiSesudah:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPerbandingan, getKondisiSesudah };
