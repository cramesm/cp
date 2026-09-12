const express = require('express');
const router = express.Router();
const RegistrarController = require('../controllers/registrarController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

router.use(auth);
router.use(superAdminOnly);

// @route   GET /api/registrars
router.get('/', RegistrarController.getAllRegistrars);

// @route   GET /api/registrars/:id
router.get('/:id', RegistrarController.getRegistrarById);

// @route   POST /api/registrars
router.post('/', RegistrarController.createRegistrar);

// @route   PUT /api/registrars/:id
router.put('/:id', RegistrarController.updateRegistrar);

// @route   DELETE /api/registrars/:id
router.delete('/:id', RegistrarController.deleteRegistrar);

module.exports = router;
