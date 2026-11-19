const { Router } = require('express');
const { getAll, create, createBulk, update, remove } = require('../controllers/barangMasukController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { sembunyikanUangStaf, bolehHapusAtauBatalkan } = require('../middleware/aksesStaf');

const router = Router();
router.param('id', require('../middleware/validasiInput').paramId);
router.use(verifyToken);
// Staf: tanpa bidang uang di respons (tetapi boleh mengisi harga saat mencatat), dan boleh membatalkan catatannya sendiri (lihat aksesStaf.js).
router.use(sembunyikanUangStaf({ tandaiBisaDibatalkan: true }));

router.get('/', getAll);
router.post('/', create);
router.post('/bulk', createBulk);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', bolehHapusAtauBatalkan('barang_masuk'), remove);

module.exports = router;
