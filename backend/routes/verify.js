const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const TOR = require('../models/TOR');
const Diploma = require('../models/Diploma');
const Document = require('../models/Document');

// @route   GET /api/verify/:hash
// @desc    Verify a document by its hash
router.get('/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;

        // 1. Try to find in Request
        const request = await Request.findOne({ 
            $or: [
                { documentHash: hash },
                { requestId: hash }
            ]
        });
        
        if (request) {
            // Check for blockchain record
            const transaction = await Transaction.findOne({ requestId: request.requestId });
            return res.json({
                success: true,
                data: {
                    requestId: request.requestId,
                    ownerName: request.name,
                    status: request.status,
                    documentType: request.documentType || 'Document',
                    issuedDate: request.updatedAt,
                    blockchainRecord: transaction ? {
                        txID: transaction.transactionId,
                        date: transaction.date
                    } : null
                }
            });
        }

        // 2. Try to find in TOR
        const tor = await TOR.findOne({ torId: hash });
        if (tor) {
            const transaction = await Transaction.findOne({ requestId: tor.torId });
            return res.json({
                success: true,
                data: {
                    requestId: tor.torId,
                    ownerName: tor.studentName,
                    status: tor.status === 'Finalized' ? 'Released' : tor.status,
                    documentType: 'Transcript of Records',
                    issuedDate: tor.updatedAt,
                    blockchainRecord: transaction ? {
                        txID: transaction.transactionId,
                        date: transaction.date
                    } : null
                }
            });
        }

        // 3. Try to find in Diploma
        const diploma = await Diploma.findOne({ diplomaId: hash });
        if (diploma) {
            const transaction = await Transaction.findOne({ requestId: diploma.diplomaId });
            return res.json({
                success: true,
                data: {
                    requestId: diploma.diplomaId,
                    ownerName: diploma.studentName,
                    status: diploma.status === 'Finalized' ? 'Released' : diploma.status,
                    documentType: 'Diploma',
                    issuedDate: diploma.updatedAt,
                    blockchainRecord: transaction ? {
                        txID: transaction.transactionId,
                        date: transaction.date
                    } : null
                }
            });
        }

        // 4. Try to find in Document (generic/fallback)
        const doc = await Document.findOne({
            $or: [
                { documentId: hash },
                { documentHash: hash }
            ]
        });
        if (doc) {
            const transaction = await Transaction.findOne({ requestId: doc.documentId });
            return res.json({
                success: true,
                data: {
                    requestId: doc.documentId,
                    ownerName: doc.studentName,
                    status: doc.status === 'Finalized' ? 'Released' : doc.status,
                    documentType: doc.documentType,
                    issuedDate: doc.updatedAt,
                    blockchainRecord: transaction ? {
                        txID: transaction.transactionId,
                        date: transaction.date
                    } : null
                }
            });
        }

        // If none found
        return res.status(404).json({ 
            success: false, 
            message: 'Invalid Document Hash. This document was not issued by our system.' 
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

module.exports = router;

