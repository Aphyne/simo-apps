const { Router } = require('express');
const { login, logout, me, googleLogin } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.post('/login', login);
router.post('/login/google', googleLogin);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);

module.exports = router;
