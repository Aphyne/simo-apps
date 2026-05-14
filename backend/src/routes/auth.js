const { Router } = require('express');
const { login, logout, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);

module.exports = router;
