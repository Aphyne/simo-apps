const pool = require('../db/pool');
const { periksaAngka } = require('../utils/validasi');

// Pengaturan yang nilainya harus angka dalam rentang tertentu.
const SPEC_NUMERIK = {
  default_service_level: { min: 1, max: 100, label: 'Service level default' },
  default_lead_time: { min: 1, max: 365, int: true, label: 'Lead time default' },
  default_biaya_pesan: { max: 1e9, label: 'Biaya pesan default' },
  threshold_expired_hari: { min: 1, max: 3650, int: true, label: 'Ambang kedaluarsa' },
  biaya_pesan_per_faktur: { max: 1e9, label: 'Biaya pesan per faktur' },
};

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
      if (SPEC_NUMERIK[key]) {
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
    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    console.error('pengaturan.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getPengaturan, updatePengaturan };
