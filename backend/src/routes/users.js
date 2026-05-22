const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getUsers, createUser, updateUser, resetPassword, toggleAktif, deleteUser } = require('../controllers/userController');

const adminOnly = [verifyToken, requireRole('admin')];

router.get('/',                      ...adminOnly, getUsers);
router.post('/',                     ...adminOnly, createUser);
router.put('/:id',                   ...adminOnly, updateUser);
router.post('/:id/reset-password',   ...adminOnly, resetPassword);
router.patch('/:id/toggle-aktif',    ...adminOnly, toggleAktif);
router.delete('/:id',                ...adminOnly, deleteUser);

module.exports = router;
