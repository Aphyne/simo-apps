const pool = require('../db/pool');
const { periksaAngka } = require('../utils/validasi');
const { hitungUlangSemua } = require('../services/stokService');

// Pengaturan yang nilainya harus angka dalam rentang tertentu.
const SPEC_NUMERIK = {
  default_service_level: { min: 1, max: 100, label: 'Service level default' },
  default_lead_time: { min: 1, max: 365, int: true, label: 'Lead time default' },
  default_biaya_pesan: { max: 1e9, label: 'Biaya pesan default' },
  threshold_expired_hari: { min: 1, max: 3650, int: true, label: 'Ambang kedaluarsa' },
  biaya_pesan_per_faktur: { max: 1e9, label: 'Biaya pesan per faktur' },
};

// Cut-off: kosong (belum diisi) atau tanggal YYYY-MM-DD yang valid dan tidak di masa depan (WIB).
async function periksaCutoff(value) {
  const v = String(value).trim();
  if (v === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Tanggal cut-off harus berformat YYYY-MM-DD';
  const { rows } = await pool.query(
    `SELECT to_char($1::text::date, 'YYYY-MM-DD') = $1::text AS sah, $1::text::date > (NOW() AT TIME ZONE 'Asia/Jakarta')::date AS depan`,
    [v]
  ).catch(() => ({ rows: [{ sah: false }] }));
  if (!rows[0].sah) return 'Tanggal cut-off tidak valid';
  if (rows[0].depan) return 'Tanggal cut-off tidak boleh setelah hari ini';
  return null;
}

// GET /api/pengaturan
async function getPengaturan(req, res) {
  try {
    const { rows } = await pool.query('SELECT key, value, deskripsi FROM pengaturan ORDER BY key ASC');
    // Ubah array menjadi object { key: value }
    const data = {};
    rows.forEach(r => { data[r.key] = { value: r.value, deskripsi: r.deskripsi }; });
    res.json({ success: true, data });
  } catch (err) {
    console.error('pengaturan.get:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// PUT /api/pengaturan — update banyak key sekaligus
async function updatePengaturan(req, res) {
  const updates = req.body; // { key: value, ... }
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada data yang dikirim' });
  }
  try {
    // Validasi SEMUA dulu sebelum menulis apa pun, supaya tidak tersimpan setengah.
    const { rows: adaRows } = await pool.query('SELECT key FROM pengaturan');
    const kunciAda = new Set(adaRows.map((r) => r.key));
    for (const [key, value] of Object.entries(updates)) {
      if (!kunciAda.has(key)) {
        return res.status(400).json({ success: false, message: `Pengaturan "${key}" tidak dikenal` });
      }
      if (typeof value !== 'string' && typeof value !== 'number') {
        return res.status(400).json({ success: false, message: `Nilai "${key}" tidak valid` });
      }
      if (key === 'tanggal_cutoff') {
        const salah = await periksaCutoff(value);
        if (salah) return res.status(400).json({ success: false, message: salah });
      } else if (SPEC_NUMERIK[key]) {
        const salah = periksaAngka({ [key]: value }, { [key]: SPEC_NUMERIK[key] });
        if (salah || String(value).trim() === '') {
          return res.status(400).json({ success: false, message: salah || `${SPEC_NUMERIK[key].label} wajib diisi` });
        }
      } else if (String(value).length > 255) {
        return res.status(400).json({ success: false, message: `Nilai "${key}" terlalu panjang (maks 255 karakter)` });
      }
    }
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'UPDATE pengaturan SET value=$1, updated_at=NOW() WHERE key=$2',
        [String(value), key]
      );
    }
    // Cut-off menggeser jendela data permintaan → semua obat dihitung ulang supaya EOQ/ROP langsung ikut.
    let hitungUlang = null;
    if (Object.prototype.hasOwnProperty.call(updates, 'tanggal_cutoff')) {
      hitungUlang = await hitungUlangSemua();
    }
    res.json({
      success: true,
      message: hitungUlang
        ? `Pengaturan berhasil disimpan. ${hitungUlang.jumlah - hitungUlang.gagal} obat dihitung ulang.`
        : 'Pengaturan berhasil disimpan',
    });
  } catch (err) {
    console.error('pengaturan.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPengaturan, updatePengaturan };
