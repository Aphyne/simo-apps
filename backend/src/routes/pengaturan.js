const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getPengaturan, updatePengaturan } = require('../controllers/pengaturanController');

router.get('/',  verifyToken, getPengaturan);
router.put('/',  verifyToken, requireRole('admin'), updatePengaturan);

module.exports = router;
