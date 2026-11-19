const pool = require('../db/pool');

// Aturan akses khusus STAF (keputusan Boss, 19 Nov 2026):
//  1. Staf tidak boleh melihat uang: harga beli, biaya pesan/simpan, total biaya, PPN, diskon. Harga jual per satuan
//     boleh dilihat di data obat dan di riwayat Stok KELUAR (membantu staf menghitung penjualan yang dia catat; total per
//     transaksi ikut boleh). Di Stok masuk dan laporan ikut dibuang. Angka gabungan (pendapatan harian/bulanan, grafik)
//     tetap hanya admin. Pembuangan dilakukan di SINI (respons API), bukan hanya disembunyikan di tampilan.
//  2. Staf ikut mencatat faktur, jadi boleh MENGISI semua isian harga lewat Stok masuk (harga beli, harga jual, PPN,
//     diskon, biaya simpan %). Sifatnya hanya menulis: yang tersimpan tidak dikembalikan ke staf (lihat poin 1).
//     Mengubah catatan (PUT) hanya admin; salah ketik: batalkan lalu catat ulang.
//  3. Staf boleh membatalkan (menghapus) catatan stok masuk/keluar yang DIA SENDIRI buat dalam MENIT_BATAL_STAF menit.
//     Selebihnya hanya admin. Pembatalan memakai kode hapus yang sama (stok dikembalikan, kalkulasi dihitung ulang).
// Admin dan superadmin tidak terpengaruh.

const MENIT_BATAL_STAF = 10;

const KUNCI_UANG = new Set([
  'harga_beli', 'harga_beli_dus', 'biaya_pesan', 'biaya_simpan', 'total_biaya', 'ppn_pct', 'diskon_pct', 'biaya_simpan_pct',
]);

function bersihkan(nilai, buangHargaJual) {
  if (Array.isArray(nilai)) return nilai.map((n) => bersihkan(n, buangHargaJual));
  if (nilai && typeof nilai === 'object' && !(nilai instanceof Date)) {
    const hasil = {};
    for (const [k, v] of Object.entries(nilai)) {
      if (KUNCI_UANG.has(k) || (buangHargaJual && k === 'harga_jual')) continue;
      hasil[k] = bersihkan(v, buangHargaJual);
    }
    return hasil;
  }
  return nilai;
}

function dalamBatas(createdAt) {
  return Date.now() - new Date(createdAt).getTime() <= MENIT_BATAL_STAF * 60000;
}

// Pasang SETELAH verifyToken. Untuk staf, setiap res.json dibersihkan dari bidang uang.
//   izinkanHargaJual: true  -> harga_jual per satuan tetap ada (data obat)
//   tandaiBisaDibatalkan    -> baris dengan user_id dan created_at diberi `bisa_dibatalkan` (milik staf ini, masih dalam batas waktu)
function sembunyikanUangStaf({ izinkanHargaJual = false, tandaiBisaDibatalkan = false } = {}) {
  return (req, res, next) => {
    if (req.user?.role !== 'staf') return next();
    const jsonAsli = res.json.bind(res);
    res.json = (badan) => {
      if (!badan || typeof badan !== 'object') return jsonAsli(badan);
      let isi = badan;
      if (tandaiBisaDibatalkan && Array.isArray(badan.data)) {
        isi = {
          ...badan,
          data: badan.data.map((r) => (r && r.created_at
            ? { ...r, bisa_dibatalkan: r.user_id === req.user.id && dalamBatas(r.created_at) }
            : r)),
        };
      }
      // Seluruh badan dibersihkan (bukan hanya `data`): mis. laporan kartu stok mengirim `obat` di luar `data`.
      return jsonAsli(bersihkan(isi, !izinkanHargaJual));
    };
    next();
  };
}

// DELETE: admin selalu boleh; staf hanya catatan buatannya sendiri dalam batas waktu; peran lain ditolak.
function bolehHapusAtauBatalkan(tabel) {
  // `tabel` berasal dari kode (bukan input pengguna), aman dipakai di SQL.
  return async (req, res, next) => {
    const peran = req.user?.role;
    if (peran === 'admin') return next();
    if (peran !== 'staf') return res.status(403).json({ success: false, message: 'Akses ditolak' });
    try {
      const { rows } = await pool.query(`SELECT user_id, created_at FROM ${tabel} WHERE id = $1`, [req.params.id]);
      if (!rows.length) return next(); // biarkan handler menjawab 404 seperti biasa
      const r = rows[0];
      if (r.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Staf hanya bisa membatalkan catatan yang dibuatnya sendiri. Minta admin untuk yang lain.' });
      }
      if (!dalamBatas(r.created_at)) {
        return res.status(403).json({ success: false, message: `Batas waktu pembatalan ${MENIT_BATAL_STAF} menit sudah lewat. Minta admin untuk menghapusnya.` });
      }
      next();
    } catch (err) {
      console.error('aksesStaf.bolehHapusAtauBatalkan:', err.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}

module.exports = { MENIT_BATAL_STAF, sembunyikanUangStaf, bolehHapusAtauBatalkan };
