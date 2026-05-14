const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.use(verifyToken);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
