const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const requireAdmin = requireRole('admin');
const { jalankanSimulasi, simpanSimulasi, getSimulasi, deleteSimulasi } = require('../controllers/simulasiController');

router.get('/',           verifyToken, requireAdmin, getSimulasi);
router.post('/jalankan', verifyToken, requireAdmin, jalankanSimulasi);
router.post('/simpan',   verifyToken, requireAdmin, simpanSimulasi);
router.delete('/:id',    verifyToken, requireAdmin, deleteSimulasi);

module.exports = router;
