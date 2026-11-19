const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { catatHalaman, heartbeat, getLog, getRingkasan, getAnalitik } = require('../controllers/aktivitasController');

// Dikirim otomatis oleh frontend untuk semua pengguna yang login
router.post('/halaman',   verifyToken, catatHalaman);
router.post('/heartbeat', verifyToken, heartbeat);

// Hanya peneliti (superadmin)
router.get('/',           verifyToken, requireRole('superadmin'), getLog);
router.get('/ringkasan',  verifyToken, requireRole('superadmin'), getRingkasan);
router.get('/analitik',   verifyToken, requireRole('superadmin'), getAnalitik);

module.exports = router;
