const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { catatHalaman, heartbeat, getLog, getRingkasan } = require('../controllers/aktivitasController');

// Dikirim otomatis oleh frontend untuk semua pengguna yang login
router.post('/halaman',   verifyToken, catatHalaman);
router.post('/heartbeat', verifyToken, heartbeat);

// Hanya peneliti (superadmin)
router.get('/',           verifyToken, requireRole('superadmin'), getLog);
router.get('/ringkasan',  verifyToken, requireRole('superadmin'), getRingkasan);

module.exports = router;
