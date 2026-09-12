const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

router.use(auth);
router.use(superAdminOnly);

// @route   GET /api/admins
router.get('/', AdminController.getAllAdmins);

// @route   POST /api/admins
router.post('/', AdminController.createAdmin);

// @route   POST /api/admins/:id/reset-password
router.post('/:id/reset-password', AdminController.resetAdminPassword);

// @route   PUT /api/admins/:id
router.put('/:id', AdminController.updateAdmin);

// @route   DELETE /api/admins/:id
router.delete('/:id', AdminController.deleteAdmin);

module.exports = router;
