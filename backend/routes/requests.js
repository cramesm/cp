const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/requestController');
const { auth, superAdminOnly, registrarOnly } = require('../middleware/authMiddleware');
const { validate, createRequestValidation, requestStatusValidation } = require('../middleware/validationMiddleware');

// Get all requests
router.get('/', auth, RequestController.getAllRequests);

// Get single request by ID
router.get('/:id', auth, RequestController.getRequestById);

// Request Policy (Mobile client discovery)
router.get('/policy', (_req, res) => res.json({ success: true, express: null }));

// Get raw PDF for request
router.get('/:id/pdf', auth, RequestController.getDocumentPdf);

// Create new request
router.post('/', auth, createRequestValidation, validate, RequestController.createRequest);

// Update request (Registrar Staff, Registrar Admin, Super Admin only)
router.put('/:id', auth, registrarOnly, requestStatusValidation, validate, RequestController.updateRequest);

// Claim document (Requester or Authorized Staff)
router.post('/:id/claim', auth, RequestController.claimRequest);

// Generate hash for request (Registrar Staff, Registrar Admin, Super Admin only)
router.post('/:id/generate-hash', auth, registrarOnly, RequestController.generateHash);

// Bulk delete requests (Super Admin only)
router.post('/bulk-delete', auth, superAdminOnly, RequestController.bulkDeleteRequests);

// Delete single request (Super Admin only)
router.delete('/:id', auth, superAdminOnly, RequestController.deleteRequest);

module.exports = router;
