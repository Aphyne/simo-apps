const { Router } = require('express');
const { getAll, getDropdown, getById, create, update, remove } = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = Router();
router.param('id', require('../middleware/validasiInput').paramId);

router.use(verifyToken);

// Dropdown (id + nama) — semua role, dipakai form Stok Masuk. Didaftarkan
// sebelum requireRole('admin') di bawah supaya tidak ikut terblokir.
router.get('/dropdown', getDropdown);

// Sisanya (daftar lengkap, detail, kelola) — admin only.
router.use(requireRole('admin'));

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
