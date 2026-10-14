const { Router } = require('express');
const { getAll, create, createBulk, update, remove } = require('../controllers/barangMasukController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = Router();
router.use(verifyToken);

router.get('/', getAll);
router.post('/', create);
router.post('/bulk', createBulk);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
