const { Router } = require('express');
const { getAll, getById, create, update, remove, getReorderAlert, getPerhitungan, hitungUlang, getBatchSummary, getOpsi } = require('../controllers/obatController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { sembunyikanUangStaf } = require('../middleware/aksesStaf');

const router = Router();
router.param('id', require('../middleware/validasiInput').paramId);

router.use(verifyToken);
// Staf melihat harga jual (mis. untuk kasir) tetapi tidak harga beli dan biaya (lihat aksesStaf.js).
router.use(sembunyikanUangStaf({ izinkanHargaJual: true }));

router.get('/', getAll);
router.get('/reorder-alert', getReorderAlert);
router.get('/opsi', getOpsi);
router.get('/:id/perhitungan', requireRole('admin'), getPerhitungan);
router.get('/:id/batch-summary', getBatchSummary);
router.get('/:id', getById);
router.post('/', requireRole('admin'), create);
router.post('/:id/hitung-ulang', requireRole('admin'), hitungUlang);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
