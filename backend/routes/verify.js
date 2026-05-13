const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');

// @route   GET /api/verify/:hash
// @desc    Verify a document by its hash
router.get('/:hash', async (req, res) => {
    try {
        const request = await Request.findOne({ 
            $or: [
                { documentHash: req.params.hash },
                { requestId: req.params.hash }
            ]
        });
        
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid Document Hash. This document was not issued by our system.' 
            });
        }

        // Check for blockchain record
        const transaction = await Transaction.findOne({ requestId: request.requestId });

        res.json({
            success: true,
            data: {
                requestId: request.requestId,
                ownerName: request.name,
                status: request.status,
                issuedDate: request.updatedAt,
                blockchainRecord: transaction ? {
                    txID: transaction.transactionId,
                    date: transaction.date
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

module.exports = router;
