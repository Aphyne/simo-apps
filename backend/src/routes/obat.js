const { Router } = require('express');
const { getAll, getById, create, update, remove, getReorderAlert, getPerhitungan, hitungUlang, getBatchSummary } = require('../controllers/obatController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = Router();

router.use(verifyToken);

router.get('/', getAll);
router.get('/reorder-alert', getReorderAlert);
router.get('/:id/perhitungan', requireRole('admin'), getPerhitungan);
router.get('/:id/batch-summary', getBatchSummary);
router.get('/:id', getById);
router.post('/', requireRole('admin'), create);
router.post('/:id/hitung-ulang', requireRole('admin'), hitungUlang);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
