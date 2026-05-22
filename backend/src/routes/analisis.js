const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getPerbandingan, getKondisiSesudah } = require('../controllers/analisisController');

router.get('/perbandingan', verifyToken, getPerbandingan);
router.get('/kondisi-sesudah', verifyToken, getKondisiSesudah);

module.exports = router;
