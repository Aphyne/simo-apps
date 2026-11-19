const { Router } = require('express');
const { getSummary, getTrenPermintaan, getPerbandinganBiaya, getPembelianPenjualan } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = Router();
router.use(verifyToken);

router.get('/summary', getSummary);
router.get('/tren-permintaan', getTrenPermintaan);
// Perbandingan biaya memuat uang: tidak untuk staf (superadmin tetap boleh, dipakai halaman /design).
router.get('/perbandingan-biaya', requireRole('admin', 'superadmin'), getPerbandinganBiaya);
// Memuat harga beli dan pendapatan: hanya admin.
router.get('/pembelian-penjualan', requireRole('admin'), getPembelianPenjualan);

module.exports = router;
