const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getLaporanStok,
  getLaporanBarangMasuk,
  getLaporanBarangKeluar,
  getLaporanKedaluarsa,
  getLaporanEoqRop,
} = require('../controllers/laporanController');

router.get('/stok',          verifyToken, getLaporanStok);
router.get('/barang-masuk',  verifyToken, getLaporanBarangMasuk);
router.get('/barang-keluar', verifyToken, getLaporanBarangKeluar);
router.get('/kedaluarsa',    verifyToken, getLaporanKedaluarsa);
router.get('/eoq-rop',       verifyToken, getLaporanEoqRop);

module.exports = router;
