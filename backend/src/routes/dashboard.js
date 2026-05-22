const { Router } = require('express');
const { getSummary, getTrenPermintaan, getPerbandinganBiaya } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();
router.use(verifyToken);

router.get('/summary', getSummary);
router.get('/tren-permintaan', getTrenPermintaan);
router.get('/perbandingan-biaya', getPerbandinganBiaya);

module.exports = router;
