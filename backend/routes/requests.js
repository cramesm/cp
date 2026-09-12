const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/requestController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

// Get all requests
router.get('/', auth, RequestController.getAllRequests);

// Get single request by ID
router.get('/:id', auth, RequestController.getRequestById);

// Create new request
router.post('/', auth, RequestController.createRequest);

// Update request
router.put('/:id', auth, RequestController.updateRequest);

// Generate hash for request
router.post('/:id/generate-hash', auth, RequestController.generateHash);

// Bulk delete requests (Super Admin only)
router.post('/bulk-delete', auth, superAdminOnly, RequestController.bulkDeleteRequests);

// Delete single request (Super Admin only)
router.delete('/:id', auth, superAdminOnly, RequestController.deleteRequest);

module.exports = router;
