const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { sembunyikanUangStaf } = require('../middleware/aksesStaf');
const {
  getLaporanStok,
  getLaporanBarangMasuk,
  getLaporanBarangKeluar,
  getLaporanKedaluarsa,
  getLaporanEoqRop,
  getLaporanKartuStok,
} = require('../controllers/laporanController');

// Staf tidak boleh melihat uang: bidang harga dan biaya dibuang dari respons (lihat aksesStaf.js).
router.use(verifyToken, sembunyikanUangStaf());

router.get('/stok',          getLaporanStok);
router.get('/barang-masuk',  getLaporanBarangMasuk);
router.get('/barang-keluar', getLaporanBarangKeluar);
router.get('/kedaluarsa',    getLaporanKedaluarsa);
// Laporan EOQ/ROP memuat biaya pesan, biaya simpan, dan total biaya: hanya admin.
router.get('/eoq-rop',       requireRole('admin'), getLaporanEoqRop);
router.get('/kartu-stok',    getLaporanKartuStok);

module.exports = router;
