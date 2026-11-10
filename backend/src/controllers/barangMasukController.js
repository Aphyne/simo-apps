const pool = require('../db/pool');
const { updateExpiredTerdekat, hitungUlangObat } = require('../services/stokService');
const { HttpError, idValid, desimalPositif, nonNegatif, angkaDalamRentang, tanggalValid, balasHttpError } = require('../utils/validasi');

// Error yang sengaja dilempar dari dalam transaksi createBulk — dibedakan dari
// error tak terduga supaya bisa direspon sebagai 400 (kesalahan input), bukan 500.
class BulkValidationError extends Error {}

// Baris barang_masuk hasil impor faktur lama (Agustus–Oktober) ditandai lewat catatan
// "Riwayat faktur…". Stok sudah termasuk barang ini di snapshot, jadi baris itu hanya
// riwayat: tidak menambah stok dan dikecualikan dari hitungan sisa batch.
function isRiwayatFaktur(row) {
  return typeof row.catatan === 'string' && row.catatan.startsWith('Riwayat faktur');
}

// true kalau biaya_simpan_pct di luar 0–100 atau bukan angka — dipakai di create,
// update, dan createBulk supaya H (biaya simpan) tidak pernah negatif/tidak masuk akal.
function biayaSimpanPctInvalid(pct) {
  if (pct === undefined || pct === null || pct === '') return false;
  const n = parseFloat(pct);
  return isNaN(n) || n < 0 || n > 100;
}

// Default ke 20 hanya kalau benar-benar kosong (undefined/null/''). 0 adalah nilai
// valid dan harus dipakai apa adanya — jangan dicek dengan falsy (`pct ? ... : 20`),
// karena 0 ikut falsy dan akan salah jatuh ke 20.
function resolveBiayaSimpanPct(pct) {
  return (pct === undefined || pct === null || pct === '') ? 20 : parseFloat(pct);
}

// Biaya pesan (S) dihitung PER FAKTUR, bukan per obat — satu kali ongkir/admin
// dibagi rata ke tiap obat BERBEDA yang ada dalam faktur yang sama (jumlahObatUnik),
// supaya total biaya pesan tidak melebih-hitung saat EOQ dihitung per obat.
// 2 baris batch untuk obat yang sama dihitung sebagai 1 obat, bukan 2.
async function hitungBiayaPesanPerObat(client, jumlahObatUnik) {
  const { rows } = await client.query(
    "SELECT value FROM pengaturan WHERE key = 'biaya_pesan_per_faktur'"
  );
  const biayaPerFaktur = rows.length ? parseFloat(rows[0].value) : 5000;
  const n = jumlahObatUnik > 0 ? jumlahObatUnik : 1;
  return parseFloat((biayaPerFaktur / n).toFixed(4));
}

async function getAll(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const tanggal = req.query.tanggal?.trim() || '';
    const dari = req.query.dari?.trim() || '';
    const sampai = req.query.sampai?.trim() || '';

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.nama ILIKE $${params.length} OR o.kode ILIKE $${params.length} OR bm.no_faktur ILIKE $${params.length} OR bm.no_batch ILIKE $${params.length} OR s.nama ILIKE $${params.length})`);
    }
    if (tanggal) {
      params.push(tanggal);
      conditions.push(`bm.tanggal = $${params.length}`);
    }
    if (dari) {
      params.push(dari);
      conditions.push(`bm.tanggal >= $${params.length}`);
    }
    if (sampai) {
      params.push(sampai);
      conditions.push(`bm.tanggal <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM barang_masuk bm
       JOIN obat o ON bm.obat_id = o.id
       LEFT JOIN supplier s ON bm.supplier_id = s.id
       ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT
         bm.*,
         o.nama AS nama_obat,
         o.kode AS kode_obat,
         o.satuan,
         s.nama AS nama_supplier,
         u.nama AS nama_user,
         u.username,
         u.role AS role_user
       FROM barang_masuk bm
       JOIN obat o ON bm.obat_id = o.id
       LEFT JOIN supplier s ON bm.supplier_id = s.id
       LEFT JOIN users u ON bm.user_id = u.id
       ${where}
       ORDER BY bm.tanggal DESC, bm.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('barangMasuk.getAll:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { tanggal, obat_id, jumlah_dus, supplier_id, no_faktur, no_batch, expired_batch, catatan, harga_beli_dus, harga_jual, biaya_simpan_pct } = req.body;
  const user_id = req.user?.id ?? null;

  if (!tanggal || !obat_id || !jumlah_dus) {
    return res.status(400).json({ success: false, message: 'Tanggal, obat, dan jumlah wajib diisi' });
  }
  if (!supplier_id || !no_faktur || !no_batch || !expired_batch) {
    return res.status(400).json({ success: false, message: 'Supplier, No. Faktur, No. Batch, dan Expired Batch wajib diisi' });
  }
  if (!desimalPositif(jumlah_dus, 1000000)) {
    return res.status(400).json({ success: false, message: 'Jumlah dus harus angka lebih dari 0' });
  }
  if (!tanggalValid(tanggal) || !tanggalValid(expired_batch)) {
    return res.status(400).json({ success: false, message: 'Format tanggal / expired tidak valid (YYYY-MM-DD)' });
  }
  if (!idValid(obat_id) || !idValid(supplier_id)) {
    return res.status(400).json({ success: false, message: 'Obat atau supplier tidak valid' });
  }
  if ((harga_beli_dus && nonNegatif(harga_beli_dus) === null) || (harga_jual && nonNegatif(harga_jual) === null)) {
    return res.status(400).json({ success: false, message: 'Harga harus angka tidak negatif' });
  }
  if (biayaSimpanPctInvalid(biaya_simpan_pct)) {
    return res.status(400).json({ success: false, message: 'Biaya simpan harus antara 0 sampai 100' });
  }

  try {
    // Seluruh pembacaan stok → insert → update stok dalam SATU transaksi dengan kunci baris
    // (FOR UPDATE). Sebelumnya tiap langkah memakai koneksi berbeda sehingga barang masuk
    // paralel saling menimpa stok (stok 10 padahal seharusnya 100 — temuan QA BIZ-02).
    let obat, rows, stok_sesudah, harga_beli_per_satuan, harga_jual_per_satuan, biaya_simpan;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [obat_id]);
      if (!obatRows.length) throw new HttpError(404, 'Obat tidak ditemukan');
      obat = obatRows[0];

      // Cegah catat ganda (mis. klik dua kali): faktur + obat + batch yang sama sudah ada.
      const { rows: dup } = await client.query(
        'SELECT 1 FROM barang_masuk WHERE no_faktur = $1 AND obat_id = $2 AND no_batch = $3 LIMIT 1',
        [no_faktur, obat_id, no_batch]
      );
      if (dup.length) throw new HttpError(409, 'Barang masuk dengan No. Faktur, obat, dan No. Batch yang sama sudah tercatat');

      const jumlah_satuan = Math.round(parseFloat(jumlah_dus) * obat.satuan_per_dus);
      const stok_sebelum = obat.stok;
      stok_sesudah = stok_sebelum + jumlah_satuan;

      // Harga beli disimpan per satuan (input per dus → bagi isi per dus)
      const spd = obat.satuan_per_dus || 1;
      harga_beli_per_satuan = harga_beli_dus ? parseFloat((parseFloat(harga_beli_dus) / spd).toFixed(4)) : null;
      harga_jual_per_satuan = harga_jual ? parseFloat(harga_jual) : null;
      const pct = resolveBiayaSimpanPct(biaya_simpan_pct);
      biaya_simpan = harga_beli_per_satuan !== null ? parseFloat((harga_beli_per_satuan * (pct / 100)).toFixed(4)) : null;

      const ins = await client.query(
        `INSERT INTO barang_masuk
           (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, no_batch, expired_batch, catatan, harga_beli, harga_jual, user_id, stok_sebelum, stok_sesudah)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          tanggal, obat_id, jumlah_dus, jumlah_satuan,
          supplier_id || null, no_faktur || null,
          no_batch || null, expired_batch || null,
          catatan || null, harga_beli_per_satuan, harga_jual_per_satuan,
          user_id, stok_sebelum, stok_sesudah,
        ]
      );
      rows = ins.rows;

      await client.query('UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2', [stok_sesudah, obat_id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    await updateExpiredTerdekat(obat_id);

    // Auto-update harga & supplier dari barang masuk terbaru
    const updateFields = [];
    const updateParams = [];
    if (supplier_id) {
      updateParams.push(supplier_id);
      updateFields.push(`supplier_id = $${updateParams.length}`);
    }
    if (harga_beli_per_satuan !== null) {
      updateParams.push(harga_beli_per_satuan);
      updateFields.push(`harga_beli = $${updateParams.length}`);
    }
    if (harga_jual_per_satuan !== null) {
      updateParams.push(harga_jual_per_satuan);
      updateFields.push(`harga_jual = $${updateParams.length}`);
    }
    if (biaya_simpan !== null) {
      updateParams.push(biaya_simpan);
      updateFields.push(`biaya_simpan = $${updateParams.length}`);
    }
    // 1 obat dalam transaksi ini → S = biaya_pesan_per_faktur penuh (tidak dibagi)
    const biayaPesanTunggal = await hitungBiayaPesanPerObat(pool, 1);
    updateParams.push(biayaPesanTunggal);
    updateFields.push(`biaya_pesan = $${updateParams.length}`);

    if (updateFields.length > 0) {
      updateParams.push(obat_id);
      await pool.query(
        `UPDATE obat SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${updateParams.length}`,
        updateParams
      );
      await hitungUlangObat(obat_id);
    }

    res.status(201).json({
      success: true,
      data: { ...rows[0], nama_obat: obat.nama, kode_obat: obat.kode, satuan: obat.satuan },
      message: 'Barang masuk berhasil dicatat',
    });
  } catch (err) {
    if (balasHttpError(err, res)) return;
    console.error('barangMasuk.create:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Edit satu baris barang masuk (admin only). Obat TIDAK bisa diganti — kalau obatnya
// salah, hapus baris ini dan catat ulang, bukan pindah stok antar obat di tengah edit.
// Efek stok lama ditarik balik dulu, baru efek nilai baru diterapkan, dalam 1 transaksi.
async function update(req, res) {
  const { id } = req.params;
  const { tanggal, jumlah_dus, supplier_id, no_faktur, no_batch, expired_batch, catatan, harga_beli_dus, harga_jual, biaya_simpan_pct, ppn_pct } = req.body;

  if (!tanggal || !jumlah_dus || !desimalPositif(jumlah_dus, 1000000)) {
    return res.status(400).json({ success: false, message: 'Tanggal dan jumlah dus (angka lebih dari 0) wajib diisi' });
  }
  if (!tanggalValid(tanggal) || (expired_batch && !tanggalValid(expired_batch))) {
    return res.status(400).json({ success: false, message: 'Format tanggal / expired tidak valid (YYYY-MM-DD)' });
  }
  if ((harga_beli_dus && nonNegatif(harga_beli_dus) === null) || (harga_jual && nonNegatif(harga_jual) === null)
      || (ppn_pct && angkaDalamRentang(ppn_pct, 0, 100) === null)) {
    return res.status(400).json({ success: false, message: 'Harga harus angka tidak negatif dan PPN 0–100' });
  }
  if (!supplier_id || !no_faktur || !no_batch || !expired_batch) {
    return res.status(400).json({ success: false, message: 'Supplier, No. Faktur, No. Batch, dan Expired Batch wajib diisi' });
  }
  if (biayaSimpanPctInvalid(biaya_simpan_pct)) {
    return res.status(400).json({ success: false, message: 'Biaya simpan harus antara 0 sampai 100' });
  }

  let client;
  try { client = await pool.connect(); } catch (err) {
    console.error('pool.connect:', err.message);
    return res.status(503).json({ success: false, message: 'Database tidak tersedia, coba lagi sebentar' });
  }
  try {
    await client.query('BEGIN');

    const { rows: bmRows } = await client.query('SELECT * FROM barang_masuk WHERE id = $1 FOR UPDATE', [id]);
    if (!bmRows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: 'Data barang masuk tidak ditemukan' });
    }
    const old = bmRows[0];

    if (isRiwayatFaktur(old)) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        message: 'Riwayat faktur tidak bisa diedit (stok tidak ditambah dari baris ini). Hapus lalu catat ulang kalau datanya salah.',
      });
    }

    const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [old.obat_id]);
    const obat = obatRows[0];
    const spd = obat.satuan_per_dus || 1;

    const jumlah_dus_baru = parseFloat(jumlah_dus);
    const jumlah_satuan_baru = Math.round(jumlah_dus_baru * spd);

    // Tarik balik efek lama, baru terapkan efek baru — supaya edit = 1 langkah atomik,
    // bukan hapus+insert terpisah yang rawan gagal di tengah.
    const stok_setelah_reverse = obat.stok - old.jumlah_satuan;
    const stok_baru = stok_setelah_reverse + jumlah_satuan_baru;

    if (stok_baru < 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        message: `Tidak bisa disimpan — perubahan ini membuat stok jadi minus. Kemungkinan sebagian stok dari batch ini sudah terjual.`,
      });
    }

    const ppn = ppn_pct ? parseFloat(ppn_pct) : 0;
    let harga_beli_per_satuan;
    if (harga_beli_dus) {
      const hargaRiilPerDus = parseFloat(harga_beli_dus) * (1 + ppn / 100);
      harga_beli_per_satuan = parseFloat((hargaRiilPerDus / spd).toFixed(4));
    } else {
      harga_beli_per_satuan = parseFloat(obat.harga_beli);
    }
    const harga_jual_per_satuan = harga_jual ? parseFloat(harga_jual) : parseFloat(obat.harga_jual);
    const pct = resolveBiayaSimpanPct(biaya_simpan_pct);
    const biaya_simpan = parseFloat((harga_beli_per_satuan * (pct / 100)).toFixed(4));

    const { rows: updated } = await client.query(
      `UPDATE barang_masuk SET
         tanggal=$1, jumlah_dus=$2, jumlah_satuan=$3, supplier_id=$4, no_faktur=$5,
         no_batch=$6, expired_batch=$7, catatan=$8, harga_beli=$9, harga_jual=$10, ppn_pct=$11,
         stok_sebelum=$12, stok_sesudah=$13
       WHERE id=$14
       RETURNING *`,
      [
        tanggal, jumlah_dus_baru, jumlah_satuan_baru, supplier_id, no_faktur,
        no_batch, expired_batch, catatan || null, harga_beli_per_satuan, harga_jual_per_satuan, ppn,
        stok_setelah_reverse, stok_baru, id,
      ]
    );

    await client.query(
      `UPDATE obat SET stok=$1, supplier_id=$2, harga_beli=$3, harga_jual=$4, biaya_simpan=$5, updated_at=NOW() WHERE id=$6`,
      [stok_baru, supplier_id, harga_beli_per_satuan, harga_jual_per_satuan, biaya_simpan, obat.id]
    );

    await client.query('COMMIT');
    client.release();

    await updateExpiredTerdekat(obat.id);
    await hitungUlangObat(obat.id);

    res.json({
      success: true,
      data: { ...updated[0], nama_obat: obat.nama, kode_obat: obat.kode, satuan: obat.satuan },
      message: 'Barang masuk berhasil diperbarui',
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('barangMasuk.update:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Hapus satu baris barang masuk (admin only). Stok ditarik balik sejumlah baris itu;
// ditolak kalau hasilnya bikin stok minus (indikasi sebagian sudah terjual).
async function remove(req, res) {
  const { id } = req.params;

  let client;
  try { client = await pool.connect(); } catch (err) {
    console.error('pool.connect:', err.message);
    return res.status(503).json({ success: false, message: 'Database tidak tersedia, coba lagi sebentar' });
  }
  try {
    await client.query('BEGIN');

    const { rows: bmRows } = await client.query('SELECT * FROM barang_masuk WHERE id = $1 FOR UPDATE', [id]);
    if (!bmRows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: 'Data barang masuk tidak ditemukan' });
    }
    const old = bmRows[0];

    // Baris "Riwayat faktur" tidak pernah menambah stok, jadi menghapusnya juga
    // tidak boleh mengurangi stok — cukup hapus barisnya.
    if (isRiwayatFaktur(old)) {
      await client.query('DELETE FROM barang_masuk WHERE id = $1', [id]);
      await client.query('COMMIT');
      client.release();
      return res.json({ success: true, message: 'Riwayat faktur berhasil dihapus (stok tidak berubah)' });
    }

    const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [old.obat_id]);
    const obat = obatRows[0];
    const stok_baru = obat.stok - old.jumlah_satuan;

    if (stok_baru < 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        success: false,
        message: `Tidak bisa dihapus — sebagian stok dari batch ini kemungkinan sudah terjual (stok akan jadi minus).`,
      });
    }

    await client.query('DELETE FROM barang_masuk WHERE id = $1', [id]);
    await client.query('UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2', [stok_baru, obat.id]);

    await client.query('COMMIT');
    client.release();

    await updateExpiredTerdekat(obat.id);
    await hitungUlangObat(obat.id);

    res.json({ success: true, message: 'Barang masuk berhasil dihapus' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('barangMasuk.remove:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Catat beberapa obat sekaligus dalam satu transaksi ("keranjang") — dipakai form
// multi-item Barang Masuk (1 faktur PBF biasanya berisi beberapa obat). Kalau ada
// satu item gagal, semua item di-rollback, tidak ada yang setengah tercatat.
//
// Catatan: Diskon % sengaja belum didukung di sini — posisinya (level faktur vs
// per-obat) masih belum diputuskan, lihat Fase 15 di docs/08-development-roadmap.md.
async function createBulk(req, res) {
  const { tanggal, supplier_id, no_faktur, ppn_pct, catatan, items } = req.body;
  const user_id = req.user?.id ?? null;

  if (!tanggal || !supplier_id || !no_faktur) {
    return res.status(400).json({ success: false, message: 'Tanggal, supplier, dan No. Faktur wajib diisi' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Minimal 1 obat harus diisi' });
  }
  if (!tanggalValid(tanggal) || !idValid(supplier_id)) {
    return res.status(400).json({ success: false, message: 'Tanggal atau supplier tidak valid' });
  }
  if (ppn_pct && angkaDalamRentang(ppn_pct, 0, 100) === null) {
    return res.status(400).json({ success: false, message: 'PPN harus antara 0 sampai 100' });
  }
  if (items.length > 200) {
    return res.status(400).json({ success: false, message: 'Maksimal 200 baris per faktur' });
  }
  for (const item of items) {
    if (!item || !idValid(item.obat_id) || !desimalPositif(item.jumlah_dus, 1000000)) {
      return res.status(400).json({ success: false, message: 'Setiap baris harus punya obat valid dan jumlah dus angka lebih dari 0' });
    }
    if (!tanggalValid(item.expired_batch)) {
      return res.status(400).json({ success: false, message: 'Expired Batch tidak valid (YYYY-MM-DD)' });
    }
    if ((item.harga_beli_dus && nonNegatif(item.harga_beli_dus) === null) || (item.harga_jual && nonNegatif(item.harga_jual) === null)) {
      return res.status(400).json({ success: false, message: 'Harga harus angka tidak negatif' });
    }
    if (!item.no_batch || !item.expired_batch) {
      return res.status(400).json({ success: false, message: 'Setiap baris wajib diisi No. Batch dan Expired Batch' });
    }
    if (biayaSimpanPctInvalid(item.biaya_simpan_pct)) {
      return res.status(400).json({ success: false, message: 'Biaya simpan harus antara 0 sampai 100' });
    }
  }

  const ppn = ppn_pct ? parseFloat(ppn_pct) : 0;
  // Jumlah OBAT BERBEDA dalam faktur ini — 2 baris batch untuk obat yang sama
  // dihitung 1, bukan 2 (lihat hitungBiayaPesanPerObat).
  const jumlahObatUnikDiFaktur = new Set(items.map((it) => it.obat_id)).size;

  let client;
  try { client = await pool.connect(); } catch (err) {
    console.error('pool.connect:', err.message);
    return res.status(503).json({ success: false, message: 'Database tidak tersedia, coba lagi sebentar' });
  }
  let hasil = [];
  try {
    await client.query('BEGIN');

    // Kunci semua obat yang terlibat dalam urutan id tetap (naik) — mencegah deadlock saat
    // dua faktur dengan urutan item terbalik diproses bersamaan (temuan QA BIZ-04).
    await client.query('SELECT id FROM obat WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', [items.map((it) => Number(it.obat_id))]);

    // Tolak baris ganda (faktur + obat + batch sama), baik di dalam request maupun yang sudah tercatat.
    const kunciBaris = new Set();
    for (const it of items) {
      const kunci = it.obat_id + '|' + it.no_batch;
      if (kunciBaris.has(kunci)) throw new HttpError(400, 'Ada baris dengan obat dan No. Batch yang sama dalam satu faktur');
      kunciBaris.add(kunci);
      const { rows: dup } = await client.query(
        'SELECT 1 FROM barang_masuk WHERE no_faktur = $1 AND obat_id = $2 AND no_batch = $3 LIMIT 1',
        [no_faktur, it.obat_id, it.no_batch]
      );
      if (dup.length) throw new HttpError(409, 'Faktur ini sudah tercatat untuk obat dan No. Batch yang sama');
    }

    const biayaPesanPerObat = await hitungBiayaPesanPerObat(client, jumlahObatUnikDiFaktur);

    for (const item of items) {
      // FOR UPDATE mengunci baris obat ini sampai transaksi selesai — mencegah
      // request lain (form manual/import lain) membaca stok yang sama secara bersamaan.
      const { rows: obatRows } = await client.query('SELECT * FROM obat WHERE id = $1 FOR UPDATE', [item.obat_id]);
      if (!obatRows.length) {
        throw new BulkValidationError(`Obat dengan ID ${item.obat_id} tidak ditemukan`);
      }
      const obat = obatRows[0];
      const jumlah_dus = parseFloat(item.jumlah_dus);
      const spd = obat.satuan_per_dus || 1;
      const jumlah_satuan = Math.round(jumlah_dus * spd);

      const stok_sebelum = obat.stok;
      const stok_sesudah = stok_sebelum + jumlah_satuan;

      // Harga: kalau diisi → hitung dari harga faktur + PPN. Kalau dikosongkan →
      // backfill harga master apa adanya (termasuk kalau masih 0, obat.harga_beli/
      // harga_jual selalu NOT NULL DEFAULT 0, tidak perlu pengecualian khusus).
      let harga_beli_per_satuan;
      if (item.harga_beli_dus) {
        const hargaRiilPerDus = parseFloat(item.harga_beli_dus) * (1 + ppn / 100);
        harga_beli_per_satuan = parseFloat((hargaRiilPerDus / spd).toFixed(4));
      } else {
        harga_beli_per_satuan = parseFloat(obat.harga_beli);
      }

      const harga_jual_per_satuan = item.harga_jual
        ? parseFloat(item.harga_jual)
        : parseFloat(obat.harga_jual);

      const pct = resolveBiayaSimpanPct(item.biaya_simpan_pct);
      const biaya_simpan = parseFloat((harga_beli_per_satuan * (pct / 100)).toFixed(4));

      const { rows } = await client.query(
        `INSERT INTO barang_masuk
           (tanggal, obat_id, jumlah_dus, jumlah_satuan, supplier_id, no_faktur, no_batch, expired_batch, catatan, harga_beli, harga_jual, ppn_pct, user_id, stok_sebelum, stok_sesudah)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          tanggal, obat.id, jumlah_dus, jumlah_satuan,
          supplier_id, no_faktur,
          item.no_batch, item.expired_batch,
          catatan || null, harga_beli_per_satuan, harga_jual_per_satuan, ppn,
          user_id, stok_sebelum, stok_sesudah,
        ]
      );

      await client.query('UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2', [stok_sesudah, obat.id]);

      hasil.push({
        barang_masuk: rows[0],
        obat_id: obat.id,
        nama_obat: obat.nama,
        kode_obat: obat.kode,
        satuan: obat.satuan,
        harga_beli_per_satuan,
        harga_jual_per_satuan,
        biaya_simpan,
        biaya_pesan: biayaPesanPerObat,
      });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    if (err instanceof BulkValidationError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (balasHttpError(err, res)) return;
    console.error('barangMasuk.createBulk:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
  client.release();

  // Setelah commit: update harga master + biaya_simpan per obat yang kena dampak,
  // lalu hitung ulang EOQ/ROP. Kalkulasi turunan ini kegagalannya tidak boleh
  // membatalkan data yang sudah tersimpan — makanya try/catch per obat.
  for (const h of hasil) {
    try {
      await pool.query(
        `UPDATE obat SET supplier_id = $1, harga_beli = $2, harga_jual = $3, biaya_simpan = $4, biaya_pesan = $5, updated_at = NOW()
         WHERE id = $6`,
        [supplier_id, h.harga_beli_per_satuan, h.harga_jual_per_satuan, h.biaya_simpan, h.biaya_pesan, h.obat_id]
      );
      await updateExpiredTerdekat(h.obat_id);
      await hitungUlangObat(h.obat_id);
    } catch (err) {
      console.error(`barangMasuk.createBulk — update obat ${h.obat_id} gagal:`, err);
    }
  }

  res.status(201).json({
    success: true,
    data: hasil.map((h) => ({
      ...h.barang_masuk,
      nama_obat: h.nama_obat,
      kode_obat: h.kode_obat,
      satuan: h.satuan,
    })),
    message: `${hasil.length} obat berhasil dicatat`,
  });
}

module.exports = { getAll, create, createBulk, update, remove };
