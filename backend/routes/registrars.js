const express = require('express');
const router = express.Router();
const RegistrarController = require('../controllers/registrarController');
const { auth, canManageStaff, itOrSuperAdmin, superAdminOnly } = require('../middleware/authMiddleware');
const { validate, createStaffValidation, updateStaffValidation } = require('../middleware/validationMiddleware');

router.use(auth);
router.use(canManageStaff);

// @route   GET /api/registrars
router.get('/', RegistrarController.getAllRegistrars);

// @route   GET /api/registrars/:id
router.get('/:id', RegistrarController.getRegistrarById);

// @route   POST /api/registrars
router.post('/', createStaffValidation, validate, RegistrarController.createRegistrar);

// @route   PUT /api/registrars/:id/role (Super Admin Only: Promote / Demote staff)
router.put('/:id/role', superAdminOnly, RegistrarController.updateRole);

// @route   PUT /api/registrars/:id
router.put('/:id', updateStaffValidation, validate, RegistrarController.updateRegistrar);

// @route   DELETE /api/registrars/:id (IT Admin and Super Admin only)
router.delete('/:id', itOrSuperAdmin, RegistrarController.deleteRegistrar);

module.exports = router;
