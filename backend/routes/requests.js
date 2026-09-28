const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/requestController');
const { auth, superAdminOnly, registrarOnly } = require('../middleware/authMiddleware');

// Get all requests
router.get('/', auth, RequestController.getAllRequests);

// Get single request by ID
router.get('/:id', auth, RequestController.getRequestById);

// Create new request
router.post('/', auth, RequestController.createRequest);

// Update request (Registrar Staff, Registrar Admin, Super Admin only)
router.put('/:id', auth, registrarOnly, RequestController.updateRequest);

// Generate hash for request (Registrar Staff, Registrar Admin, Super Admin only)
router.post('/:id/generate-hash', auth, registrarOnly, RequestController.generateHash);

// Bulk delete requests (Super Admin only)
router.post('/bulk-delete', auth, superAdminOnly, RequestController.bulkDeleteRequests);

// Delete single request (Super Admin only)
router.delete('/:id', auth, superAdminOnly, RequestController.deleteRequest);

module.exports = router;
