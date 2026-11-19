const { Router } = require('express');
const { getAll, create, createBulk, update, remove } = require('../controllers/barangKeluarController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { sembunyikanUangStaf, bolehHapusAtauBatalkan } = require('../middleware/aksesStaf');

const router = Router();
router.param('id', require('../middleware/validasiInput').paramId);
router.use(verifyToken);
// Staf: harga jual tetap terlihat (membantu menghitung penjualan yang dia catat), bidang uang lain tidak, dan boleh membatalkan
// catatannya sendiri (lihat aksesStaf.js).
router.use(sembunyikanUangStaf({ izinkanHargaJual: true, tandaiBisaDibatalkan: true }));

router.get('/', getAll);
router.post('/', create);
router.post('/bulk', createBulk);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', bolehHapusAtauBatalkan('barang_keluar'), remove);

module.exports = router;
