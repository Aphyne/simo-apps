const { Router } = require('express');
const { getAll, getById, create, update, remove, getPerhitungan, hitungUlang } = require('../controllers/obatController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.use(verifyToken);

router.get('/', getAll);
router.get('/:id/perhitungan', getPerhitungan);
router.get('/:id', getById);
router.post('/', create);
router.post('/:id/hitung-ulang', hitungUlang);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
