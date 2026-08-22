const express = require('express');
const router = express.Router();
const Refund = require('../models/Refund');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/refunds
// @desc    Get refunds (all for admin, own for students)
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        
        // Filter for students/alumni
        if (req.user.role === 'student' || req.user.role === 'alumni') {
            query = { studentEmail: req.user.email };
        }

        const refunds = await Refund.find(query).sort({ createdAt: -1 });
        res.json({ success: true, refunds });
    } catch (error) {
        console.error('Fetch refunds error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/refunds
// @desc    Create a new refund request
router.post('/', protect, async (req, res) => {
    try {
        const { transactionId, reason, otherReason } = req.body;
        
        if (!transactionId || !reason) {
            return res.status(400).json({ success: false, message: 'Missing transactionId or reason' });
        }

        // Verify transaction belongs to user
        const transaction = await Transaction.findOne({ transactionId, payerEmail: req.user.email });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
        }

        const refundId = 'REF-' + Date.now();
        const refund = await Refund.create({
            refundId,
            transactionId,
            requestId: transaction.requestId,
            studentName: req.user.name,
            studentEmail: req.user.email,
            amount: transaction.amount,
            reason,
            otherReason: otherReason || '',
            status: 'Pending'
        });

        await ActivityLog.create({
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            action: 'Refund Request',
            type: 'Request',
            status: 'Successful',
            details: `Requested refund for transaction ${transactionId}`
        });

        res.status(201).json({ success: true, message: 'Refund requested successfully', refund });
    } catch (error) {
        console.error('Create refund error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PATCH /api/refunds/:id/status
// @desc    Update refund status (Admin/Registrar only)
router.patch('/:id/status', protect, async (req, res) => {
    try {
        if (req.user.role === 'student' || req.user.role === 'alumni') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { status, adminRemarks } = req.body;
        
        const refund = await Refund.findByIdAndUpdate(
            req.params.id,
            {
                status,
                adminRemarks,
                processedBy: req.user.email,
                processedAt: new Date()
            },
            { new: true }
        );

        if (!refund) {
            return res.status(404).json({ success: false, message: 'Refund not found' });
        }

        // Also update transaction status if approved
        if (status === 'Approved') {
            await Transaction.findOneAndUpdate(
                { transactionId: refund.transactionId },
                { status: 'Refunded', adminRemarks: 'Refund processed' }
            );
        }

        res.json({ success: true, message: 'Refund updated', refund });
    } catch (error) {
        console.error('Update refund error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
