const express = require('express');
const router = express.Router();
const RefundController = require('../controllers/refundController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/refunds
router.get('/', auth, RefundController.getRefunds);

// @route   POST /api/refunds
router.post('/', auth, RefundController.createRefund);

// @route   PATCH /api/refunds/:id/status
router.patch('/:id/status', auth, RefundController.updateRefundStatus);

// @route   POST /api/refunds/bulk-delete
router.post('/bulk-delete', auth, superAdminOnly, RefundController.bulkDeleteRefunds);

// @route   DELETE /api/refunds/:id
router.delete('/:id', auth, superAdminOnly, RefundController.deleteRefund);

module.exports = router;
