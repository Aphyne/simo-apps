const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getPerbandingan, getKondisiSesudah } = require('../controllers/analisisController');

// Analisis Komparatif khusus peneliti (superadmin): bahan skripsi, bukan fitur harian apotek.

router.get('/perbandingan', verifyToken, requireRole('superadmin'), getPerbandingan);
router.get('/kondisi-sesudah', verifyToken, requireRole('superadmin'), getKondisiSesudah);

module.exports = router;
