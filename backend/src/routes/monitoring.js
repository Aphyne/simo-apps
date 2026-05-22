const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getMonitoring } = require('../controllers/monitoringController');

router.get('/', verifyToken, getMonitoring);

module.exports = router;
