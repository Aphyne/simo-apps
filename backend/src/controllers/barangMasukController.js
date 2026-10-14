const pool = require('../db/pool');
const { updateExpiredTerdekat, hitungUlangObat } = require('../services/stokService');

// Error yang sengaja dilempar dari dalam transaksi createBulk — dibedakan dari
// error tak terduga supaya bisa direspon sebagai 400 (kesalahan input), bukan 500.
class BulkValidationError extends Error {}

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
  if (parseFloat(jumlah_dus) <= 0) {
    return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0' });
  }

  try {
    const { rows: obatRows } = await pool.query('SELECT * FROM obat WHERE id = $1', [obat_id]);
    if (!obatRows.length) {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    }
    const obat = obatRows[0];

    const jumlah_satuan = Math.round(parseFloat(jumlah_dus) * obat.satuan_per_dus);
    const stok_sebelum = obat.stok;
    const stok_sesudah = stok_sebelum + jumlah_satuan;

    // Harga beli disimpan per satuan (input per dus → bagi isi per dus)
    const spd = obat.satuan_per_dus || 1;
    const harga_beli_per_satuan = harga_beli_dus ? parseFloat((parseFloat(harga_beli_dus) / spd).toFixed(4)) : null;
    const harga_jual_per_satuan = harga_jual ? parseFloat(harga_jual) : null;
    const pct = biaya_simpan_pct ? parseFloat(biaya_simpan_pct) : 20;
    const biaya_simpan = harga_beli_per_satuan !== null ? parseFloat((harga_beli_per_satuan * (pct / 100)).toFixed(4)) : null;

    const { rows } = await pool.query(
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

    // Update stok
    await pool.query(
      'UPDATE obat SET stok = $1, updated_at = NOW() WHERE id = $2',
      [stok_sesudah, obat_id]
    );

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

  if (!tanggal || !jumlah_dus || parseFloat(jumlah_dus) <= 0) {
    return res.status(400).json({ success: false, message: 'Tanggal dan jumlah dus (lebih dari 0) wajib diisi' });
  }
  if (!supplier_id || !no_faktur || !no_batch || !expired_batch) {
    return res.status(400).json({ success: false, message: 'Supplier, No. Faktur, No. Batch, dan Expired Batch wajib diisi' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bmRows } = await client.query('SELECT * FROM barang_masuk WHERE id = $1 FOR UPDATE', [id]);
    if (!bmRows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: 'Data barang masuk tidak ditemukan' });
    }
    const old = bmRows[0];

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
    const pct = biaya_simpan_pct ? parseFloat(biaya_simpan_pct) : 20;
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bmRows } = await client.query('SELECT * FROM barang_masuk WHERE id = $1 FOR UPDATE', [id]);
    if (!bmRows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, message: 'Data barang masuk tidak ditemukan' });
    }
    const old = bmRows[0];

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
  for (const item of items) {
    if (!item.obat_id || !item.jumlah_dus || parseFloat(item.jumlah_dus) <= 0) {
      return res.status(400).json({ success: false, message: 'Setiap baris harus punya obat dan jumlah dus lebih dari 0' });
    }
    if (!item.no_batch || !item.expired_batch) {
      return res.status(400).json({ success: false, message: 'Setiap baris wajib diisi No. Batch dan Expired Batch' });
    }
  }

  const ppn = ppn_pct ? parseFloat(ppn_pct) : 0;

  const client = await pool.connect();
  let hasil = [];
  try {
    await client.query('BEGIN');

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

      const pct = item.biaya_simpan_pct ? parseFloat(item.biaya_simpan_pct) : 20;
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
      });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    if (err instanceof BulkValidationError) {
      return res.status(400).json({ success: false, message: err.message });
    }
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
        `UPDATE obat SET supplier_id = $1, harga_beli = $2, harga_jual = $3, biaya_simpan = $4, updated_at = NOW()
         WHERE id = $5`,
        [supplier_id, h.harga_beli_per_satuan, h.harga_jual_per_satuan, h.biaya_simpan, h.obat_id]
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
