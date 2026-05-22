const { Router } = require('express');
const { getAll, create } = require('../controllers/barangMasukController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();
router.use(verifyToken);

router.get('/', getAll);
router.post('/', create);

module.exports = router;
